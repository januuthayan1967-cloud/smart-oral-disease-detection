import Pharmacy from '../models/Pharmacy.js';
import MedicineOrder from '../models/MedicineOrder.js';
import DirectOrder from '../models/DirectOrder.js';
import Notification from '../models/Notification.js';
import Payment from '../models/Payment.js';
import { AppError } from '../utils/AppError.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Prescription-based Orders (existing) ─────────────────────────────────────

export const getPharmacyOrders = async (req, res) => {
  const pharmacyId = req.user._id;
  const filter = { pharmacyId };

  if (req.query.status) {
    filter.status = req.query.status;
  }

  const orders = await MedicineOrder.find(filter)
    .sort({ createdAt: -1 })
    .populate({
      path: 'prescriptionId',
      populate: { path: 'dentistId', select: 'name specialization' },
    })
    .populate('userId', 'name email phone');

  res.json({ success: true, count: orders.length, data: orders });
};

export const updateOrderStatus = async (req, res) => {
  const { status, rejectionReason } = req.body;
  const validStatuses = ['accepted', 'preparing', 'out_for_delivery', 'delivered', 'completed', 'cancelled'];

  if (!validStatuses.includes(status)) {
    throw new AppError('Invalid status.', 400);
  }

  const order = await MedicineOrder.findById(req.params.id);

  if (!order) {
    throw new AppError('Order not found.', 404);
  }

  if (order.pharmacyId.toString() !== req.user._id.toString()) {
    throw new AppError('Not authorized.', 403);
  }

  if (status === 'accepted' && order.status !== 'pending') {
    throw new AppError('Only pending orders can be accepted.', 400);
  }

  if (status === 'cancelled' && order.status === 'pending') {
    order.rejectionReason = rejectionReason || 'Order rejected by pharmacy';
  }

  order.status = status;
  await order.save();

  await order.populate([
    {
      path: 'prescriptionId',
      populate: { path: 'dentistId', select: 'name specialization' },
    },
    { path: 'userId', select: 'name email phone' },
  ]);

  // Notify user about status change
  try {
    const statusLabels = {
      accepted: 'accepted',
      preparing: 'being prepared',
      out_for_delivery: 'out for delivery',
      delivered: 'delivered',
      cancelled: 'cancelled',
    };
    await Notification.create({
      recipientId: order.userId._id || order.userId,
      recipientRole: 'user',
      title: 'Order Status Updated',
      message: `Your prescription order has been ${statusLabels[status] || status}.`,
      type: 'status_updated',
      orderId: order._id,
    });
  } catch (_) { /* non-critical */ }

  res.json({ success: true, data: order });
};

export const acceptOrder = async (req, res) => {
  req.body.status = 'accepted';
  return updateOrderStatus(req, res);
};

export const rejectOrder = async (req, res) => {
  req.body.status = 'cancelled';
  return updateOrderStatus(req, res);
};

export const getOrderHistory = async (req, res) => {
  const orders = await MedicineOrder.find({ pharmacyId: req.user._id })
    .sort({ createdAt: -1 })
    .populate({
      path: 'prescriptionId',
      populate: { path: 'dentistId', select: 'name specialization' },
    })
    .populate('userId', 'name email phone');

  res.json({ success: true, count: orders.length, data: orders });
};

// ─── Direct Orders (marketplace-based) ────────────────────────────────────────

export const getPharmacyDirectOrders = async (req, res) => {
  const filter = { pharmacyId: req.user._id };

  if (req.query.status) filter.status = req.query.status;
  if (req.query.search) {
    filter.$or = [
      { customerName: { $regex: req.query.search, $options: 'i' } },
      { contactNumber: { $regex: req.query.search, $options: 'i' } },
      { deliveryAddress: { $regex: req.query.search, $options: 'i' } },
    ];
  }

  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    DirectOrder.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'name email phone'),
    DirectOrder.countDocuments(filter),
  ]);

  res.json({ success: true, count: orders.length, total, data: orders });
};

export const updateDirectOrderStatus = async (req, res) => {
  const { status, rejectionReason } = req.body;
  const validStatuses = ['accepted', 'preparing', 'out_for_delivery', 'delivered', 'completed', 'cancelled'];

  if (!validStatuses.includes(status)) {
    throw new AppError('Invalid status.', 400);
  }

  const order = await DirectOrder.findById(req.params.id);
  if (!order) throw new AppError('Order not found.', 404);
  if (order.pharmacyId.toString() !== req.user._id.toString()) {
    throw new AppError('Not authorized.', 403);
  }

  if (status === 'cancelled') {
    order.rejectionReason = rejectionReason || 'Cancelled by pharmacy';
  }

  order.status = status;
  await order.save();

  await order.populate('userId', 'name email phone');

  // Notify user
  try {
    const statusLabels = {
      accepted: 'accepted',
      preparing: 'being prepared',
      out_for_delivery: 'out for delivery',
      delivered: 'delivered',
      cancelled: 'cancelled',
    };
    await Notification.create({
      recipientId: order.userId._id || order.userId,
      recipientRole: 'user',
      title: 'Order Status Updated',
      message: `Your medicine order has been ${statusLabels[status] || status}.`,
      type: 'status_updated',
      orderId: order._id,
    });
  } catch (_) { /* non-critical */ }

  res.json({ success: true, data: order });
};

export const updateDirectOrderPaymentStatus = async (req, res) => {
  const { paymentStatus } = req.body;
  const validPaymentStatuses = ['pending', 'paid', 'failed', 'cancelled'];

  if (!validPaymentStatuses.includes(paymentStatus)) {
    throw new AppError('Invalid payment status.', 400);
  }

  const order = await DirectOrder.findById(req.params.id);
  if (!order) throw new AppError('Order not found.', 404);
  if (order.pharmacyId.toString() !== req.user._id.toString()) {
    throw new AppError('Not authorized.', 403);
  }

  order.paymentStatus = paymentStatus;

  if (paymentStatus === 'paid' && order.paymentId) {
    const payment = await Payment.findById(order.paymentId);
    if (payment) {
      payment.status = 'paid';
      payment.paidAt = new Date();
      await payment.save();
    }
  }

  await order.save();
  await order.populate('userId', 'name email phone');

  res.json({ success: true, data: order });
};

// ─── Profile ──────────────────────────────────────────────────────────────────

export const getPharmacyProfile = async (req, res) => {
  const pharmacy = await Pharmacy.findById(req.user._id);
  res.json({ success: true, data: pharmacy.toPublicJSON() });
};

export const updatePharmacyProfile = async (req, res) => {
  const allowedFields = ['pharmacyName', 'ownerName', 'phone', 'address', 'city', 'district'];
  const updates = {};

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  if (req.body.latitude && req.body.longitude) {
    updates.location = {
      type: 'Point',
      coordinates: [parseFloat(req.body.longitude), parseFloat(req.body.latitude)],
    };
  }

  const pharmacy = await Pharmacy.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  });

  res.json({ success: true, data: pharmacy.toPublicJSON() });
};

// ─── Inventory ────────────────────────────────────────────────────────────────

export const getInventory = async (req, res) => {
  const pharmacy = await Pharmacy.findById(req.user._id);
  res.json({ success: true, data: pharmacy.inventory });
};

export const updateInventory = async (req, res) => {
  const pharmacy = await Pharmacy.findById(req.user._id);
  pharmacy.inventory = req.body.inventory || [];
  await pharmacy.save();

  res.json({ success: true, data: pharmacy.inventory });
};

export const addInventoryItem = async (req, res) => {
  const { medicineName, category, description, quantity, price, expiryDate } = req.body;
  const image = req.file
    ? `/uploads/medicines/${req.file.filename}`
    : (req.body.image || '');

  const pharmacy = await Pharmacy.findById(req.user._id);
  pharmacy.inventory.push({
    medicineName,
    category: category || 'General',
    description: description || '',
    image,
    quantity: Number(quantity),
    price: Number(price),
    expiryDate: expiryDate || null,
  });
  await pharmacy.save();

  res.status(201).json({ success: true, data: pharmacy.inventory });
};

export const updateInventoryItem = async (req, res) => {
  const { itemId } = req.params;
  const pharmacy = await Pharmacy.findById(req.user._id);

  const item = pharmacy.inventory.id(itemId);
  if (!item) throw new AppError('Inventory item not found.', 404);

  const { medicineName, category, description, quantity, price, expiryDate } = req.body;

  if (medicineName !== undefined) item.medicineName = medicineName;
  if (category !== undefined) item.category = category;
  if (description !== undefined) item.description = description;
  if (quantity !== undefined) item.quantity = Number(quantity);
  if (price !== undefined) item.price = Number(price);
  if (expiryDate !== undefined) item.expiryDate = expiryDate || null;

  // Handle image update
  if (req.file) {
    // Delete old image if it exists on disk
    if (item.image && item.image.startsWith('/uploads/medicines/')) {
      const oldPath = path.join(__dirname, '..', item.image);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    item.image = `/uploads/medicines/${req.file.filename}`;
  } else if (req.body.image !== undefined) {
    item.image = req.body.image;
  }

  await pharmacy.save();
  res.json({ success: true, data: pharmacy.inventory });
};

export const deleteInventoryItem = async (req, res) => {
  const { itemId } = req.params;
  const pharmacy = await Pharmacy.findById(req.user._id);

  const item = pharmacy.inventory.id(itemId);
  if (!item) throw new AppError('Inventory item not found.', 404);

  // Delete image file from disk
  if (item.image && item.image.startsWith('/uploads/medicines/')) {
    const imgPath = path.join(__dirname, '..', item.image);
    if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
  }

  pharmacy.inventory.pull(itemId);
  await pharmacy.save();

  res.json({ success: true, data: pharmacy.inventory });
};

export default {
  getPharmacyOrders,
  updateOrderStatus,
  acceptOrder,
  rejectOrder,
  getOrderHistory,
  getPharmacyDirectOrders,
  updateDirectOrderStatus,
  updateDirectOrderPaymentStatus,
  getPharmacyProfile,
  updatePharmacyProfile,
  getInventory,
  updateInventory,
  addInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
};
