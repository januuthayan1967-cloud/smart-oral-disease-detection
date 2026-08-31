import DirectOrder from '../models/DirectOrder.js';
import Cart from '../models/Cart.js';
import Notification from '../models/Notification.js';
import Pharmacy from '../models/Pharmacy.js';
import OrderTrackingHistory from '../models/OrderTrackingHistory.js';
import { recordTrackingEvent, getOrderTrackingEvents } from '../services/trackingService.js';
import { AppError } from '../utils/AppError.js';

/**
 * POST /api/direct-orders
 * Place an order from cart items.
 * Body: { pharmacyId, customerName, deliveryAddress, contactNumber, notes }
 */
export const placeOrder = async (req, res) => {
  const { pharmacyId, customerName, deliveryAddress, contactNumber, notes } = req.body;

  if (!pharmacyId || !customerName || !deliveryAddress || !contactNumber) {
    throw new AppError('pharmacyId, customerName, deliveryAddress, and contactNumber are required.', 400);
  }

  const cart = await Cart.findOne({ userId: req.user._id });
  if (!cart || cart.items.length === 0) {
    throw new AppError('Your cart is empty.', 400);
  }

  // Filter items belonging to this pharmacy
  const pharmacyItems = cart.items.filter(
    (item) => item.pharmacyId.toString() === pharmacyId
  );
  if (pharmacyItems.length === 0) {
    throw new AppError('No cart items found for this pharmacy.', 400);
  }

  // Verify pharmacy still exists and is approved
  const pharmacy = await Pharmacy.findOne({ _id: pharmacyId, status: 'approved' });
  if (!pharmacy) throw new AppError('Pharmacy not found or not approved.', 404);

  // Pre-validate inventory stock availability and messages
  for (const item of pharmacyItems) {
    const inventoryItem = pharmacy.inventory.id(item.inventoryItemId);
    if (!inventoryItem) {
      throw new AppError(`Medicine "${item.medicineName}" not found in pharmacy inventory.`, 404);
    }
    if (inventoryItem.quantity < 1) {
      throw new AppError('This item is currently out of stock.', 400);
    }
    if (item.quantity > inventoryItem.quantity) {
      throw new AppError(`Only ${inventoryItem.quantity} items are available in stock.`, 400);
    }
  }

  // Perform atomic concurrency-safe stock deductions with rollback capability
  const deductedItems = [];
  try {
    for (const item of pharmacyItems) {
      const updatedPharmacy = await Pharmacy.findOneAndUpdate(
        {
          _id: pharmacyId,
          status: 'approved',
          inventory: {
            $elemMatch: {
              _id: item.inventoryItemId,
              quantity: { $gte: item.quantity },
            },
          },
        },
        {
          $inc: { 'inventory.$.quantity': -item.quantity },
        },
        { new: true }
      );

      if (!updatedPharmacy) {
        // Race condition: another purchase depleted or reduced stock
        // Rollback any items already deducted in this batch
        for (const deducted of deductedItems) {
          await Pharmacy.findOneAndUpdate(
            { _id: pharmacyId, 'inventory._id': deducted.inventoryItemId },
            { $inc: { 'inventory.$.quantity': deducted.quantity } }
          );
        }

        // Check fresh stock to produce exact error message
        const freshPharmacy = await Pharmacy.findById(pharmacyId);
        const freshItem = freshPharmacy?.inventory?.id(item.inventoryItemId);
        const latestStock = freshItem ? freshItem.quantity : 0;

        if (latestStock === 0) {
          throw new AppError('This item is currently out of stock.', 400);
        } else {
          throw new AppError(`Only ${latestStock} items are available in stock.`, 400);
        }
      }

      deductedItems.push({
        inventoryItemId: item.inventoryItemId,
        quantity: item.quantity,
      });
    }

    // Build order items with snapshots
    const orderItems = pharmacyItems.map((item) => ({
      inventoryItemId: item.inventoryItemId,
      medicineName: item.medicineName,
      category: item.category || 'General',
      image: item.image || '',
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      totalPrice: item.unitPrice * item.quantity,
    }));

    const totalAmount = orderItems.reduce((sum, item) => sum + item.totalPrice, 0);

    const order = await DirectOrder.create({
      userId: req.user._id,
      pharmacyId,
      items: orderItems,
      customerName,
      deliveryAddress,
      contactNumber,
      notes: notes || '',
      totalAmount,
      status: 'pending',
    });

    // Record initial tracking event
    try {
      await recordTrackingEvent({
        orderId: order._id,
        orderType: 'DirectOrder',
        status: 'pending',
        previousStatus: null,
        message: `Direct order placed for ${orderItems.length} item(s). Total: Rs. ${totalAmount.toFixed(2)}.`,
        actionBy: req.user._id,
        actionByModel: 'User',
        actionByRole: 'user',
        actionByName: customerName || req.user.name || 'Customer',
      });
    } catch (trackErr) {
      console.warn('Failed to record initial tracking event for direct order:', trackErr.message);
    }

    // Remove ordered items from cart
    cart.items = cart.items.filter(
      (item) => item.pharmacyId.toString() !== pharmacyId
    );
    await cart.save();

    await order.populate('pharmacyId', 'pharmacyName phone address city');

    // Notify pharmacy
    try {
      await Notification.create({
        recipientId: pharmacyId,
        recipientRole: 'pharmacy',
        title: 'New Direct Order',
        message: `New order from ${customerName} with ${orderItems.length} item(s). Total: Rs. ${totalAmount.toFixed(2)}.`,
        type: 'order_placed',
        orderId: order._id,
      });
    } catch (_) { /* non-critical */ }

    const orderObj = order.toObject();
    orderObj.trackingHistory = await getOrderTrackingEvents(order._id, order);

    return res.status(201).json({ success: true, data: orderObj });
  } catch (err) {
    // If order creation failed, rollback any deducted items
    if (deductedItems.length > 0 && !(err instanceof AppError)) {
      for (const deducted of deductedItems) {
        try {
          await Pharmacy.findOneAndUpdate(
            { _id: pharmacyId, 'inventory._id': deducted.inventoryItemId },
            { $inc: { 'inventory.$.quantity': deducted.quantity } }
          );
        } catch (_) {}
      }
    }
    throw err;
  }
};

/**
 * GET /api/direct-orders
 * Get all direct orders for the authenticated user.
 */
export const getMyOrders = async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const filter = { userId: req.user._id };
  if (status) filter.status = status;

  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

  const [orders, total] = await Promise.all([
    DirectOrder.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10))
      .populate('pharmacyId', 'pharmacyName phone address city'),
    DirectOrder.countDocuments(filter),
  ]);

  const orderIds = orders.map((o) => o._id);
  const allEvents = await OrderTrackingHistory.find({ orderId: { $in: orderIds } })
    .sort({ createdAt: 1 })
    .lean();

  const eventMap = {};
  for (const ev of allEvents) {
    const key = ev.orderId.toString();
    if (!eventMap[key]) eventMap[key] = [];
    eventMap[key].push(ev);
  }

  const enrichedOrders = await Promise.all(
    orders.map(async (o) => {
      const oObj = o.toObject ? o.toObject() : o;
      const historyList = eventMap[o._id.toString()];
      if (historyList && historyList.length > 0) {
        oObj.trackingHistory = historyList;
      } else {
        oObj.trackingHistory = await getOrderTrackingEvents(o._id, o);
      }
      return oObj;
    })
  );

  res.json({ success: true, count: enrichedOrders.length, total, data: enrichedOrders });
};

/**
 * GET /api/direct-orders/:id
 * Get a single direct order by ID.
 */
export const getOrderById = async (req, res) => {
  const order = await DirectOrder.findById(req.params.id)
    .populate('pharmacyId', 'pharmacyName phone address city')
    .populate('userId', 'name email');

  if (!order) throw new AppError('Order not found.', 404);

  const isOwner = order.userId._id.toString() === req.user._id.toString();
  const isPharmacy =
    req.user.role === 'pharmacy' &&
    order.pharmacyId._id.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isOwner && !isPharmacy && !isAdmin) {
    throw new AppError('Not authorized.', 403);
  }

  const orderObj = order.toObject();
  orderObj.trackingHistory = await getOrderTrackingEvents(order._id, order);

  res.json({ success: true, data: orderObj });
};

/**
 * GET /api/direct-orders/:id/tracking
 * Dedicated endpoint to fetch tracking history for a direct order.
 */
export const getDirectOrderTracking = async (req, res) => {
  const order = await DirectOrder.findById(req.params.id)
    .populate('pharmacyId', 'pharmacyName phone address city')
    .populate('userId', 'name email');

  if (!order) throw new AppError('Order not found.', 404);

  const isOwner = order.userId._id.toString() === req.user._id.toString();
  const isPharmacy =
    req.user.role === 'pharmacy' &&
    order.pharmacyId._id.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isOwner && !isPharmacy && !isAdmin) {
    throw new AppError('Not authorized to view tracking history for this order.', 403);
  }

  const history = await getOrderTrackingEvents(order._id, order);

  res.json({
    success: true,
    count: history.length,
    data: history,
    order: {
      _id: order._id,
      status: order.status,
      customerName: order.customerName,
      deliveryAddress: order.deliveryAddress,
      totalAmount: order.totalAmount,
      createdAt: order.createdAt,
      pharmacy: order.pharmacyId,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
    },
  });
};

/**
 * PUT /api/direct-orders/:id/cancel
 * Cancel a pending direct order (user only).
 */
export const cancelOrder = async (req, res) => {
  const order = await DirectOrder.findById(req.params.id);
  if (!order) throw new AppError('Order not found.', 404);
  if (order.userId.toString() !== req.user._id.toString()) {
    throw new AppError('Not authorized.', 403);
  }
  if (!['pending', 'accepted'].includes(order.status)) {
    throw new AppError('Order cannot be cancelled at this stage.', 400);
  }

  const previousStatus = order.status;
  order.status = 'cancelled';
  order.rejectionReason = 'Cancelled by customer';
  await order.save();

  try {
    await recordTrackingEvent({
      orderId: order._id,
      orderType: 'DirectOrder',
      status: 'cancelled',
      previousStatus,
      message: 'Order cancelled by customer.',
      actionBy: req.user._id,
      actionByModel: 'User',
      actionByRole: 'user',
      actionByName: req.user.name || order.customerName || 'Customer',
    });
  } catch (trackErr) {
    console.warn('Failed to record cancel tracking event:', trackErr.message);
  }

  // Notify pharmacy
  try {
    await Notification.create({
      recipientId: order.pharmacyId,
      recipientRole: 'pharmacy',
      title: 'Order Cancelled',
      message: `Customer ${order.customerName} has cancelled their order.`,
      type: 'status_updated',
      orderId: order._id,
    });
  } catch (_) { /* non-critical */ }

  res.json({ success: true, data: order });
};

/**
 * PUT /api/direct-orders/:id/confirm
 * Confirm order receipt (user only).
 */
export const confirmOrder = async (req, res) => {
  const order = await DirectOrder.findById(req.params.id);
  if (!order) throw new AppError('Order not found.', 404);

  if (order.userId.toString() !== req.user._id.toString()) {
    throw new AppError('Not authorized.', 403);
  }

  if (order.status !== 'delivered') {
    throw new AppError('Only delivered orders can be confirmed.', 400);
  }

  const previousStatus = order.status;
  order.status = 'completed';
  order.deliveryConfirmed = true;
  await order.save();

  try {
    await recordTrackingEvent({
      orderId: order._id,
      orderType: 'DirectOrder',
      status: 'completed',
      previousStatus,
      message: 'Delivery receipt confirmed by customer. Order completed.',
      actionBy: req.user._id,
      actionByModel: 'User',
      actionByRole: 'user',
      actionByName: req.user.name || order.customerName || 'Customer',
    });
  } catch (trackErr) {
    console.warn('Failed to record confirm tracking event:', trackErr.message);
  }

  // Notify pharmacy
  try {
    await Notification.create({
      recipientId: order.pharmacyId,
      recipientRole: 'pharmacy',
      title: 'Order Completed',
      message: `Customer ${order.customerName} has confirmed delivery receipt for order #${order._id.toString().substring(order._id.toString().length - 8)}.`,
      type: 'status_updated',
      orderId: order._id,
    });
  } catch (_) { /* non-critical */ }

  res.json({ success: true, data: order });
};

export default {
  placeOrder,
  getMyOrders,
  getOrderById,
  getDirectOrderTracking,
  cancelOrder,
  confirmOrder,
};
