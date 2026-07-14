import { randomUUID } from 'crypto';
import Payment from '../models/Payment.js';
import DirectOrder from '../models/DirectOrder.js';
import Prescription from '../models/Prescription.js';
import Notification from '../models/Notification.js';
import { AppError } from '../utils/AppError.js';

/**
 * Validate card fields from request body.
 * Returns sanitised safe data or throws AppError.
 */
function validateCardInput({ cardHolderName, cardNumber, cardExpiry, cvv }) {
  if (!cardHolderName || !cardNumber || !cardExpiry || !cvv) {
    throw new AppError('All card fields are required: cardHolderName, cardNumber, cardExpiry, cvv.', 400);
  }

  // Strip spaces/dashes from card number
  const rawNumber = String(cardNumber).replace(/[\s\-]/g, '');
  if (!/^\d{13,19}$/.test(rawNumber)) {
    throw new AppError('Invalid card number. Must be 13–19 digits.', 400);
  }

  // Validate expiry MM/YY or MM/YYYY
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

  // Only store last 4 digits — never store full card number
  const cardLastFour = rawNumber.slice(-4);

  return {
    cardHolderName: String(cardHolderName).trim(),
    cardLastFour,
    cardExpiry: cardExpiry.trim(),
  };
}

/**
 * POST /api/payments/pharmacy-order
 * Process payment for a direct pharmacy order.
 * Body: { orderId, method, cardHolderName?, cardNumber?, cardExpiry?, cvv? }
 */
export const processPharmacyPayment = async (req, res) => {
  const { orderId, method, cardHolderName, cardNumber, cardExpiry, cvv } = req.body;

  if (!orderId || !method) {
    throw new AppError('orderId and method are required.', 400);
  }
  if (!['cod', 'card'].includes(method)) {
    throw new AppError('method must be "cod" or "card".', 400);
  }

  const order = await DirectOrder.findById(orderId);
  if (!order) throw new AppError('Order not found.', 404);

  if (order.userId.toString() !== req.user._id.toString()) {
    throw new AppError('Not authorized to pay for this order.', 403);
  }

  if (order.paymentStatus === 'paid') {
    throw new AppError('This order has already been paid.', 400);
  }

  let safeCard = {};
  if (method === 'card') {
    safeCard = validateCardInput({ cardHolderName, cardNumber, cardExpiry, cvv });
  }

  const transactionId = randomUUID();

  const payment = await Payment.create({
    userId: req.user._id,
    orderId: order._id,
    orderType: 'pharmacy_order',
    amount: order.totalAmount,
    method,
    status: method === 'card' ? 'paid' : 'pending',
    cardHolderName: safeCard.cardHolderName || '',
    cardLastFour: safeCard.cardLastFour || '',
    cardExpiry: safeCard.cardExpiry || '',
    transactionId,
    paidAt: method === 'card' ? new Date() : null,
  });

  order.paymentMethod = method;
  order.paymentStatus = method === 'card' ? 'paid' : 'pending';
  order.paymentId = payment._id;
  await order.save();

  // Notify pharmacy about payment
  try {
    await Notification.create({
      recipientId: order.pharmacyId,
      recipientRole: 'pharmacy',
      title: method === 'card' ? 'Payment Received' : 'COD Order Placed',
      message:
        method === 'card'
          ? `Payment of Rs. ${order.totalAmount.toFixed(2)} received for order #${order._id.toString().slice(-8)}.`
          : `COD order #${order._id.toString().slice(-8)} placed. Payment on delivery.`,
      type: 'order_placed',
      orderId: order._id,
    });
  } catch (_) { /* non-critical */ }

  res.status(201).json({
    success: true,
    message: method === 'card' ? 'Payment successful!' : 'Order placed with Cash on Delivery.',
    data: { payment, order },
  });
};

/**
 * POST /api/payments/prescription
 * Process card payment to unlock a prescription for download.
 * Body: { prescriptionId, cardHolderName, cardNumber, cardExpiry, cvv }
 */
export const processPrescriptionPayment = async (req, res) => {
  const { prescriptionId, cardHolderName, cardNumber, cardExpiry, cvv } = req.body;

  if (!prescriptionId) {
    throw new AppError('prescriptionId is required.', 400);
  }

  const prescription = await Prescription.findById(prescriptionId)
    .populate('dentistId', 'userId name specialization')
    .populate('patientId', 'name email');

  if (!prescription) throw new AppError('Prescription not found.', 404);

  if (prescription.patientId._id.toString() !== req.user._id.toString()) {
    throw new AppError('Not authorized to pay for this prescription.', 403);
  }

  if (prescription.paymentStatus === 'paid') {
    throw new AppError('This prescription has already been paid for.', 400);
  }

  // Card payment is required for prescription download
  const safeCard = validateCardInput({ cardHolderName, cardNumber, cardExpiry, cvv });

  const transactionId = randomUUID();

  const payment = await Payment.create({
    userId: req.user._id,
    orderId: prescription._id,
    orderType: 'prescription',
    amount: prescription.prescriptionFee,
    method: 'card',
    status: 'paid',
    cardHolderName: safeCard.cardHolderName,
    cardLastFour: safeCard.cardLastFour,
    cardExpiry: safeCard.cardExpiry,
    transactionId,
    paidAt: new Date(),
  });

  prescription.paymentStatus = 'paid';
  prescription.paymentId = payment._id;
  await prescription.save();

  // Notify dentist
  try {
    const dentistUserId = prescription.dentistId?.userId || prescription.dentistId?._id;
    if (dentistUserId) {
      await Notification.create({
        recipientId: dentistUserId,
        recipientRole: 'dentist',
        title: 'Prescription Payment Received',
        message: `${prescription.patientId.name} has paid Rs. ${prescription.prescriptionFee} to download their prescription.`,
        type: 'order_placed',
        orderId: prescription._id,
      });
    }
  } catch (_) { /* non-critical */ }

  res.status(201).json({
    success: true,
    message: 'Payment successful! You can now download your prescription.',
    data: { payment, prescriptionId: prescription._id, paymentStatus: 'paid' },
  });
};

/**
 * GET /api/payments/my
 * Retrieve all payments made by the authenticated user.
 */
export const getMyPayments = async (req, res) => {
  const payments = await Payment.find({ userId: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, count: payments.length, data: payments });
};

export default { processPharmacyPayment, processPrescriptionPayment, getMyPayments };
