import { randomUUID } from 'crypto';
import Pharmacy from '../models/Pharmacy.js';
import MedicineOrder from '../models/MedicineOrder.js';
import Prescription from '../models/Prescription.js';
import Payment from '../models/Payment.js';
import Notification from '../models/Notification.js';
import OrderTrackingHistory from '../models/OrderTrackingHistory.js';
import { recordTrackingEvent, getOrderTrackingEvents } from '../services/trackingService.js';
import { AppError } from '../utils/AppError.js';

/**
 * Validate card fields from request body.
 * Returns sanitised safe data or throws AppError.
 */
function validateCardInput({ cardHolderName, cardNumber, cardExpiry, cvv }) {
  if (!cardHolderName || !cardNumber || !cardExpiry || !cvv) {
    throw new AppError('All card fields are required: cardHolderName, cardNumber, cardExpiry, cvv.', 400);
  }

  const rawNumber = String(cardNumber).replace(/[\s\-]/g, '');
  if (!/^\d{13,19}$/.test(rawNumber)) {
    throw new AppError('Invalid card number. Must be 13–19 digits.', 400);
  }

  if (!/^\d{2}\/\d{2,4}$/.test(cardExpiry.trim())) {
    throw new AppError('Invalid expiry date format. Use MM/YY.', 400);
  }

  const [mm, yy] = cardExpiry.trim().split('/');
  const month = parseInt(mm, 10);
  const year = parseInt(yy, 10) + (yy.length === 2 ? 2000 : 0);
  const now = new Date();
  const expDate = new Date(year, month - 1, 1);
  if (month < 1 || month > 12 || expDate < new Date(now.getFullYear(), now.getMonth(), 1)) {
    throw new AppError('Card has expired or expiry date is invalid.', 400);
  }

  if (!/^\d{3,4}$/.test(String(cvv).trim())) {
    throw new AppError('Invalid CVV. Must be 3 or 4 digits.', 400);
  }

  const cardLastFour = rawNumber.slice(-4);

  return {
    cardHolderName: String(cardHolderName).trim(),
    cardLastFour,
    cardExpiry: cardExpiry.trim(),
  };
}

/**
 * Calculate the great-circle distance between two points in kilometers (Haversine formula).
 */
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export const getNearbyPharmacies = async (req, res) => {
  const { latitude, longitude, radius = 10 } = req.query;

  if (latitude === undefined || longitude === undefined || latitude === null || longitude === null || latitude === '' || longitude === '') {
    throw new AppError('Latitude and longitude are required.', 400);
  }

  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);

  if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    throw new AppError('Invalid coordinates. Latitude must be between -90 and 90, and longitude between -180 and 180.', 400);
  }

  const isAllRadius = radius === 'all' || radius === '0' || parseFloat(radius) >= 20000;
  const parsedRadius = parseFloat(radius);
  const radiusKm = !isNaN(parsedRadius) && parsedRadius > 0 ? parsedRadius : 10;
  const maxDistanceMeters = isAllRadius ? undefined : radiusKm * 1000;

  let pharmacies = [];

  try {
    const geoNearStage = {
      near: {
        type: 'Point',
        coordinates: [lng, lat],
      },
      distanceField: 'distance',
      spherical: true,
      query: { status: 'approved' },
    };
    if (maxDistanceMeters !== undefined) {
      geoNearStage.maxDistance = maxDistanceMeters;
    }

    pharmacies = await Pharmacy.aggregate([
      { $geoNear: geoNearStage },
      {
        $project: {
          pharmacyName: 1,
          ownerName: 1,
          email: 1,
          phone: 1,
          address: 1,
          city: 1,
          district: 1,
          location: 1,
          licenseNumber: 1,
          status: 1,
          distance: 1,
          distanceKm: { $divide: ['$distance', 1000] },
        },
      },
      { $sort: { distance: 1 } },
    ]);
  } catch (geoErr) {
    console.warn('MongoDB $geoNear aggregation failed, falling back to in-memory Haversine calculation:', geoErr.message);
    const approvedPharmacies = await Pharmacy.find({ status: 'approved' })
      .select('pharmacyName ownerName email phone address city district location licenseNumber status')
      .lean();

    pharmacies = approvedPharmacies
      .map((p) => {
        let pLng, pLat;
        if (p.location?.coordinates && Array.isArray(p.location.coordinates) && p.location.coordinates.length === 2) {
          [pLng, pLat] = p.location.coordinates;
        } else if (p.latitude !== undefined && p.longitude !== undefined) {
          pLat = parseFloat(p.latitude);
          pLng = parseFloat(p.longitude);
        }

        if (typeof pLat !== 'number' || typeof pLng !== 'number' || isNaN(pLat) || isNaN(pLng)) {
          return null;
        }

        const distKm = calculateHaversineDistance(lat, lng, pLat, pLng);
        const distMeters = distKm * 1000;

        if (maxDistanceMeters !== undefined && distMeters > maxDistanceMeters) {
          return null;
        }

        return {
          ...p,
          distance: distMeters,
          distanceKm: distKm,
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.distance - b.distance);
  }

  res.json({
    success: true,
    count: pharmacies.length,
    data: pharmacies.map((p) => ({
      ...p,
      distanceKm: Math.round(p.distanceKm * 100) / 100,
    })),
  });
};

export const sendPrescriptionToPharmacy = async (req, res) => {
  const {
    prescriptionId,
    pharmacyId,
    deliveryAddress,
    paymentMethod = 'cod',
    cardHolderName,
    cardNumber,
    cardExpiry,
    cvv,
  } = req.body;

  if (!['cod', 'card'].includes(paymentMethod)) {
    throw new AppError('Invalid payment method. Must be "cod" or "card".', 400);
  }

  const prescription = await Prescription.findById(prescriptionId);
  if (!prescription) {
    throw new AppError('Prescription not found.', 404);
  }

  if (prescription.patientId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new AppError('Not authorized to send this prescription.', 403);
  }

  // Enforce payment gate: prescription consultation fee must be paid before dispatching to pharmacy
  if (req.user.role !== 'admin') {
    if (prescription.paymentStatus !== 'paid') {
      throw new AppError('Payment for this prescription must be completed before sending it to a pharmacy.', 402);
    }
    const verifiedPayment = await Payment.findOne({
      orderId: prescription._id,
      userId: req.user._id,
      orderType: 'prescription',
      status: 'paid',
    });
    if (!verifiedPayment) {
      throw new AppError('Payment verification failed. A confirmed payment is required before sending this prescription to a pharmacy.', 402);
    }
  }

  const pharmacy = await Pharmacy.findOne({ _id: pharmacyId, status: 'approved' });
  if (!pharmacy) {
    throw new AppError('Pharmacy not found or not approved.', 404);
  }

  const existingOrder = await MedicineOrder.findOne({
    prescriptionId,
    pharmacyId,
    status: { $nin: ['cancelled', 'delivered', 'completed'] },
  });

  if (existingOrder) {
    throw new AppError('An active order already exists for this prescription at this pharmacy.', 400);
  }

  // Pre-validate inventory stock availability and calculate amount
  let totalAmount = 0;
  const itemsToDeduct = [];

  for (const med of prescription.medicines) {
    const inventoryItem = pharmacy.inventory.find(
      (item) => item.medicineName.toLowerCase() === med.medicineName.toLowerCase()
    );
    if (!inventoryItem) {
      throw new AppError(`Medicine "${med.medicineName}" not found in pharmacy inventory.`, 404);
    }
    if (inventoryItem.quantity < 1) {
      throw new AppError('This item is currently out of stock.', 400);
    }
    if (med.quantity > inventoryItem.quantity) {
      throw new AppError(`Only ${inventoryItem.quantity} items are available in stock.`, 400);
    }
    totalAmount += inventoryItem.price * med.quantity;
    itemsToDeduct.push({
      inventoryItemId: inventoryItem._id,
      quantity: med.quantity,
      medicineName: med.medicineName,
    });
  }

  // Perform atomic concurrency-safe stock deduction with rollback capability
  const deductedItems = [];
  try {
    for (const item of itemsToDeduct) {
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
        // Rollback any already deducted items in this batch
        for (const deducted of deductedItems) {
          await Pharmacy.findOneAndUpdate(
            { _id: pharmacyId, 'inventory._id': deducted.inventoryItemId },
            { $inc: { 'inventory.$.quantity': deducted.quantity } }
          );
        }

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

    let safeCard = {};
    if (paymentMethod === 'card') {
      safeCard = validateCardInput({ cardHolderName, cardNumber, cardExpiry, cvv });
    }

    const order = await MedicineOrder.create({
      prescriptionId,
      pharmacyId,
      userId: req.user._id,
      deliveryAddress,
      totalAmount,
      status: 'pending',
      paymentMethod,
      paymentStatus: paymentMethod === 'card' ? 'paid' : 'pending',
    });

    if (paymentMethod === 'card') {
      const payment = await Payment.create({
        userId: req.user._id,
        orderId: order._id,
        orderType: 'medicine_order',
        amount: totalAmount,
        method: 'card',
        status: 'paid',
        cardHolderName: safeCard.cardHolderName || '',
        cardLastFour: safeCard.cardLastFour || '',
        cardExpiry: safeCard.cardExpiry || '',
        transactionId: randomUUID(),
        paidAt: new Date(),
      });
      order.paymentId = payment._id;
      await order.save();
    }

    // Record initial order placement tracking event
    try {
      await recordTrackingEvent({
        orderId: order._id,
        orderType: 'MedicineOrder',
        status: 'pending',
        previousStatus: null,
        message: paymentMethod === 'card'
          ? `Prescription order placed with online card payment. Total: Rs. ${totalAmount.toFixed(2)}.`
          : 'Prescription order placed with Cash on Delivery.',
        actionBy: req.user._id,
        actionByModel: 'User',
        actionByRole: 'user',
        actionByName: req.user.name || 'Customer',
      });
    } catch (trackErr) {
      console.warn('Failed to record initial tracking event for prescription order:', trackErr.message);
    }

    // Notify pharmacy about new prescription order
    try {
      await Notification.create({
        recipientId: pharmacy._id,
        recipientRole: 'pharmacy',
        title: paymentMethod === 'card' ? 'New Prescription Order (Paid)' : 'New Prescription Order (COD)',
        message: paymentMethod === 'card'
          ? `New prescription order #${order._id.toString().slice(-8)} placed. Payment of Rs. ${totalAmount.toFixed(2)} received.`
          : `New prescription order #${order._id.toString().slice(-8)} placed with Cash on Delivery.`,
        type: 'order_placed',
        orderId: order._id,
      });
    } catch (_) { /* non-critical */ }

    await order.populate([
      { path: 'prescriptionId', populate: { path: 'dentistId', select: 'name specialization' } },
      { path: 'pharmacyId', select: 'pharmacyName phone address city district' },
      { path: 'userId', select: 'name email phone' },
      { path: 'paymentId' },
    ]);

    const orderObj = order.toObject();
    orderObj.trackingHistory = await getOrderTrackingEvents(order._id, order);

    return res.status(201).json({ success: true, data: orderObj });
  } catch (err) {
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

export const getOrderHistory = async (req, res) => {
  const orders = await MedicineOrder.find({ userId: req.user._id })
    .sort({ createdAt: -1 })
    .populate({
      path: 'prescriptionId',
      populate: { path: 'dentistId', select: 'name specialization' },
    })
    .populate('pharmacyId', 'pharmacyName phone address city district')
    .populate('paymentId');

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

  res.json({ success: true, count: enrichedOrders.length, data: enrichedOrders });
};

export const getOrderById = async (req, res) => {
  const order = await MedicineOrder.findById(req.params.id)
    .populate({
      path: 'prescriptionId',
      populate: [
        { path: 'dentistId', select: 'name specialization' },
        { path: 'patientId', select: 'name email phone' },
      ],
    })
    .populate('pharmacyId', 'pharmacyName phone address city district')
    .populate('userId', 'name email phone')
    .populate('paymentId');

  if (!order) {
    throw new AppError('Order not found.', 404);
  }

  const isOwner = order.userId._id.toString() === req.user._id.toString();
  const isPharmacy =
    req.user.role === 'pharmacy' && order.pharmacyId._id.toString() === req.user._id.toString();

  if (!isOwner && !isPharmacy && req.user.role !== 'admin') {
    throw new AppError('Not authorized.', 403);
  }

  const orderObj = order.toObject();
  orderObj.trackingHistory = await getOrderTrackingEvents(order._id, order);

  res.json({ success: true, data: orderObj });
};

/**
 * GET /api/orders/:id/tracking
 * Dedicated endpoint to fetch tracking history for a prescription order.
 */
export const getOrderTracking = async (req, res) => {
  const order = await MedicineOrder.findById(req.params.id)
    .populate('pharmacyId', 'pharmacyName phone address city district')
    .populate('userId', 'name email phone');

  if (!order) {
    throw new AppError('Order not found.', 404);
  }

  const isOwner = order.userId._id.toString() === req.user._id.toString();
  const isPharmacy =
    req.user.role === 'pharmacy' && order.pharmacyId._id.toString() === req.user._id.toString();

  if (!isOwner && !isPharmacy && req.user.role !== 'admin') {
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
      deliveryAddress: order.deliveryAddress,
      totalAmount: order.totalAmount,
      createdAt: order.createdAt,
      pharmacy: order.pharmacyId,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
    },
  });
};

export const cancelOrder = async (req, res) => {
  const order = await MedicineOrder.findById(req.params.id);

  if (!order) {
    throw new AppError('Order not found.', 404);
  }

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
      orderType: 'MedicineOrder',
      status: 'cancelled',
      previousStatus,
      message: 'Order cancelled by customer.',
      actionBy: req.user._id,
      actionByModel: 'User',
      actionByRole: 'user',
      actionByName: req.user.name || 'Customer',
    });
  } catch (trackErr) {
    console.warn('Failed to record cancel tracking event:', trackErr.message);
  }

  res.json({ success: true, data: order });
};

/**
 * PUT /api/orders/:id/confirm
 * Confirm prescription order receipt (user only).
 */
export const confirmOrder = async (req, res) => {
  const order = await MedicineOrder.findById(req.params.id);
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
      orderType: 'MedicineOrder',
      status: 'completed',
      previousStatus,
      message: 'Delivery receipt confirmed by customer. Order completed.',
      actionBy: req.user._id,
      actionByModel: 'User',
      actionByRole: 'user',
      actionByName: req.user.name || 'Customer',
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
      message: `Customer has confirmed delivery receipt for prescription order #${order._id.toString().substring(order._id.toString().length - 8)}.`,
      type: 'status_updated',
      orderId: order._id,
    });
  } catch (_) { /* non-critical */ }

  res.json({ success: true, data: order });
};

export default {
  getNearbyPharmacies,
  sendPrescriptionToPharmacy,
  getOrderHistory,
  getOrderById,
  getOrderTracking,
  cancelOrder,
  confirmOrder,
};
