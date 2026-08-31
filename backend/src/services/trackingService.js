import OrderTrackingHistory from '../models/OrderTrackingHistory.js';

/**
 * Returns a standard user-friendly description message for a status.
 */
export const getDefaultTrackingMessage = (status, rejectionReason = '') => {
  switch (status) {
    case 'pending':
      return 'Order placed by customer.';
    case 'accepted':
      return 'Order accepted by pharmacy.';
    case 'preparing':
      return 'Order is being prepared and packed.';
    case 'out_for_delivery':
      return 'Order is out for delivery.';
    case 'delivered':
      return 'Order has been delivered to the destination.';
    case 'completed':
      return 'Delivery confirmed by customer. Order completed.';
    case 'cancelled':
      return rejectionReason ? `Order cancelled: ${rejectionReason}` : 'Order cancelled.';
    default:
      return `Order status updated to ${status}.`;
  }
};

/**
 * Record a new order tracking event in the database.
 * Enforces idempotency to avoid duplicate records on duplicate requests.
 */
export const recordTrackingEvent = async ({
  orderId,
  orderType = 'MedicineOrder',
  status,
  previousStatus = null,
  message = '',
  actionBy = null,
  actionByModel = null,
  actionByRole = 'system',
  actionByName = '',
}) => {
  if (!orderId || !status) return null;

  // Check last event to prevent duplicate transitions for the same status (TC08)
  const lastEvent = await OrderTrackingHistory.findOne({ orderId }).sort({ createdAt: -1 });
  if (lastEvent && lastEvent.status === status) {
    return lastEvent;
  }

  const effectivePreviousStatus = previousStatus !== null ? previousStatus : (lastEvent ? lastEvent.status : null);
  const effectiveMessage = message && message.trim().length > 0 ? message.trim() : getDefaultTrackingMessage(status);

  const event = await OrderTrackingHistory.create({
    orderId,
    orderType,
    status,
    previousStatus: effectivePreviousStatus,
    message: effectiveMessage,
    actionBy,
    actionByModel,
    actionByRole,
    actionByName,
  });

  return event;
};

/**
 * Retrieve tracking history for an order with fallback for legacy orders.
 */
export const getOrderTrackingEvents = async (orderId, orderDoc = null) => {
  const events = await OrderTrackingHistory.find({ orderId })
    .sort({ createdAt: 1 })
    .lean();

  if (events.length > 0) {
    return events;
  }

  // Safe fallback for legacy orders without tracking history records
  if (orderDoc) {
    const fallback = [];
    fallback.push({
      _id: `fallback-init-${orderDoc._id}`,
      orderId: orderDoc._id,
      orderType: orderDoc.items ? 'DirectOrder' : 'MedicineOrder',
      status: 'pending',
      previousStatus: null,
      message: 'Order placed by customer.',
      actionBy: orderDoc.userId?._id || orderDoc.userId || null,
      actionByModel: 'User',
      actionByRole: 'user',
      actionByName: orderDoc.customerName || orderDoc.userId?.name || 'Customer',
      createdAt: orderDoc.createdAt || new Date(),
      updatedAt: orderDoc.createdAt || new Date(),
    });

    if (orderDoc.status && orderDoc.status !== 'pending') {
      fallback.push({
        _id: `fallback-curr-${orderDoc._id}`,
        orderId: orderDoc._id,
        orderType: orderDoc.items ? 'DirectOrder' : 'MedicineOrder',
        status: orderDoc.status,
        previousStatus: 'pending',
        message: getDefaultTrackingMessage(orderDoc.status, orderDoc.rejectionReason),
        actionBy: orderDoc.pharmacyId?._id || orderDoc.pharmacyId || null,
        actionByModel: 'Pharmacy',
        actionByRole: 'pharmacy',
        actionByName: orderDoc.pharmacyId?.pharmacyName || 'Pharmacy',
        createdAt: orderDoc.updatedAt || new Date(),
        updatedAt: orderDoc.updatedAt || new Date(),
      });
    }

    return fallback;
  }

  return [];
};

export default {
  getDefaultTrackingMessage,
  recordTrackingEvent,
  getOrderTrackingEvents,
};
