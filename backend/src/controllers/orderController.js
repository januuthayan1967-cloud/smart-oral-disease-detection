import Pharmacy from '../models/Pharmacy.js';
import MedicineOrder from '../models/MedicineOrder.js';
import Prescription from '../models/Prescription.js';
import { AppError } from '../utils/AppError.js';

const RADIUS_OPTIONS = {
  5: 5000,
  10: 10000,
  20: 20000,
};

export const getNearbyPharmacies = async (req, res) => {
  const { latitude, longitude, radius = 10 } = req.query;

  if (!latitude || !longitude) {
    throw new AppError('Latitude and longitude are required.', 400);
  }

  const radiusKm = parseInt(radius, 10);
  const maxDistance = RADIUS_OPTIONS[radiusKm] || RADIUS_OPTIONS[10];

  const pharmacies = await Pharmacy.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [parseFloat(longitude), parseFloat(latitude)],
        },
        distanceField: 'distance',
        maxDistance,
        spherical: true,
        query: { status: 'approved' },
      },
    },
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
  const { prescriptionId, pharmacyId, deliveryAddress } = req.body;

  const prescription = await Prescription.findById(prescriptionId);
  if (!prescription) {
    throw new AppError('Prescription not found.', 404);
  }

  if (prescription.patientId.toString() !== req.user._id.toString()) {
    throw new AppError('Not authorized to send this prescription.', 403);
  }

  const pharmacy = await Pharmacy.findOne({ _id: pharmacyId, status: 'approved' });
  if (!pharmacy) {
    throw new AppError('Pharmacy not found or not approved.', 404);
  }

  const existingOrder = await MedicineOrder.findOne({
    prescriptionId,
    pharmacyId,
    status: { $nin: ['cancelled', 'delivered'] },
  });

  if (existingOrder) {
    throw new AppError('An active order already exists for this prescription at this pharmacy.', 400);
  }

  // Verify inventory stock availability and calculate amount
  let totalAmount = 0;
  for (const med of prescription.medicines) {
    const inventoryItem = pharmacy.inventory.find(
      (item) => item.medicineName.toLowerCase() === med.medicineName.toLowerCase()
    );
    if (!inventoryItem) {
      throw new AppError(`Medicine "${med.medicineName}" not found in pharmacy inventory.`, 404);
    }
    if (inventoryItem.quantity < med.quantity) {
      throw new AppError(`Insufficient stock for "${med.medicineName}". Available: ${inventoryItem.quantity}, Requested: ${med.quantity}`, 400);
    }
    inventoryItem.quantity -= med.quantity;
    totalAmount += inventoryItem.price * med.quantity;
  }

  // Save the updated pharmacy inventory
  await pharmacy.save();

  const order = await MedicineOrder.create({
    prescriptionId,
    pharmacyId,
    userId: req.user._id,
    deliveryAddress,
    totalAmount,
    status: 'pending',
  });

  await order.populate([
    { path: 'prescriptionId', populate: { path: 'dentistId', select: 'name specialization' } },
    { path: 'pharmacyId', select: 'pharmacyName phone address city district' },
    { path: 'userId', select: 'name email phone' },
  ]);

  res.status(201).json({ success: true, data: order });
};

export const getOrderHistory = async (req, res) => {
  const orders = await MedicineOrder.find({ userId: req.user._id })
    .sort({ createdAt: -1 })
    .populate({
      path: 'prescriptionId',
      populate: { path: 'dentistId', select: 'name specialization' },
    })
    .populate('pharmacyId', 'pharmacyName phone address city district');

  res.json({ success: true, count: orders.length, data: orders });
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
    .populate('userId', 'name email phone');

  if (!order) {
    throw new AppError('Order not found.', 404);
  }

  const isOwner = order.userId._id.toString() === req.user._id.toString();
  const isPharmacy =
    req.user.role === 'pharmacy' && order.pharmacyId._id.toString() === req.user._id.toString();

  if (!isOwner && !isPharmacy && req.user.role !== 'admin') {
    throw new AppError('Not authorized.', 403);
  }

  res.json({ success: true, data: order });
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

  order.status = 'cancelled';
  await order.save();

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

  order.status = 'completed';
  order.deliveryConfirmed = true;
  await order.save();

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
  cancelOrder,
  confirmOrder,
};
