import User from '../models/User.js';
import Prediction from '../models/Prediction.js';
import Report from '../models/Report.js';
import Appointment from '../models/Appointment.js';
import Dentist from '../models/Dentist.js';
import Education from '../models/Education.js';
import Pharmacy from '../models/Pharmacy.js';
import Prescription from '../models/Prescription.js';
import MedicineOrder from '../models/MedicineOrder.js';
import { AppError } from '../utils/AppError.js';

export const getDashboard = async (_req, res) => {
  const [
    totalUsers,
    totalDentists,
    totalPharmacies,
    pendingPharmacies,
    totalPredictions,
    totalReports,
    totalAppointments,
    totalContent,
    totalOrders,
    diseaseStats,
    monthlyPredictions,
    userGrowth,
    consultationStats,
    orderStats,
  ] = await Promise.all([
    User.countDocuments({ role: 'user' }),
    Dentist.countDocuments({ isActive: true }),
    Pharmacy.countDocuments({ status: 'approved' }),
    Pharmacy.countDocuments({ status: 'pending' }),
    Prediction.countDocuments(),
    Report.countDocuments(),
    Appointment.countDocuments(),
    Education.countDocuments(),
    MedicineOrder.countDocuments(),
    Prediction.aggregate([
      { $group: { _id: '$diseaseName', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Prediction.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 },
    ]),
    User.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 },
    ]),
    Appointment.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    MedicineOrder.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
  ]);

  const recentUsers = await User.find().sort({ createdAt: -1 }).limit(5).select('name email role createdAt');
  const recentPredictions = await Prediction.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('userId', 'name');

  res.json({
    success: true,
    data: {
      stats: {
        totalUsers,
        totalDentists,
        totalPharmacies,
        pendingPharmacies,
        totalPredictions,
        totalReports,
        totalAppointments,
        totalContent,
        totalOrders,
      },
      charts: {
        diseaseDistribution: diseaseStats.map((d) => ({
          disease: d._id,
          count: d.count,
        })),
        monthlyPredictions: monthlyPredictions.map((m) => ({
          month: `${m._id.year}-${String(m._id.month).padStart(2, '0')}`,
          count: m.count,
        })),
        userGrowth: userGrowth.map((u) => ({
          month: `${u._id.year}-${String(u._id.month).padStart(2, '0')}`,
          count: u.count,
        })),
        consultationStats: consultationStats.map((c) => ({
          status: c._id,
          count: c.count,
        })),
        orderStats: orderStats.map((o) => ({
          status: o._id,
          count: o.count,
        })),
      },
      recent: {
        users: recentUsers,
        predictions: recentPredictions,
      },
    },
  });
};

export const getUsers = async (_req, res) => {
  const users = await User.find().sort({ createdAt: -1 }).select('-password -refreshToken');
  res.json({ success: true, count: users.length, data: users });
};

export const updateUserRole = async (req, res) => {
  const allowedRoles = ['user', 'dentist', 'admin'];
  if (!allowedRoles.includes(req.body.role)) {
    throw new AppError('Invalid role.', 400);
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { role: req.body.role },
    { new: true, runValidators: true }
  ).select('-password -refreshToken');

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found.' });
  }

  res.json({ success: true, data: user });
};

export const deleteUser = async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found.' });
  }

  res.json({ success: true, message: 'User deleted successfully.' });
};

export const getPharmacyApplications = async (req, res) => {
  const filter = {};
  if (req.query.status) {
    filter.status = req.query.status;
  }

  const pharmacies = await Pharmacy.find(filter).select('-password -refreshToken').sort({ createdAt: -1 });
  res.json({ success: true, count: pharmacies.length, data: pharmacies });
};

export const approvePharmacy = async (req, res) => {
  const pharmacy = await Pharmacy.findByIdAndUpdate(
    req.params.id,
    { status: 'approved', rejectionReason: '' },
    { new: true }
  );

  if (!pharmacy) {
    throw new AppError('Pharmacy not found.', 404);
  }

  res.json({ success: true, message: 'Pharmacy approved successfully.', data: pharmacy.toPublicJSON() });
};

export const rejectPharmacy = async (req, res) => {
  const pharmacy = await Pharmacy.findByIdAndUpdate(
    req.params.id,
    {
      status: 'rejected',
      rejectionReason: req.body.reason || 'Application rejected by admin',
    },
    { new: true }
  );

  if (!pharmacy) {
    throw new AppError('Pharmacy not found.', 404);
  }

  res.json({ success: true, message: 'Pharmacy rejected.', data: pharmacy.toPublicJSON() });
};

export const getPharmacies = async (_req, res) => {
  const pharmacies = await Pharmacy.find().select('-password -refreshToken').sort({ createdAt: -1 });
  res.json({ success: true, count: pharmacies.length, data: pharmacies });
};

export const getDentists = async (_req, res) => {
  const dentists = await Dentist.find()
    .populate('userId', 'name email role professionalLicenseNumber')
    .sort({ createdAt: -1 });
  res.json({ success: true, count: dentists.length, data: dentists });
};

export const createDentist = async (req, res) => {
  const { name, email, password, qualification, specialization, experience, contact, professionalLicenseNumber } = req.body;
  const normalizedEmail = email ? email.trim().toLowerCase() : '';

  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw new AppError('Email already registered.', 400);
  }

  const existingPharmacy = await Pharmacy.findOne({ email: normalizedEmail });
  if (existingPharmacy) {
    throw new AppError('Email already registered.', 400);
  }

  const user = await User.create({
    name,
    email: normalizedEmail,
    password,
    phone: contact,
    role: 'dentist',
    isEmailVerified: true,
    professionalLicenseNumber,
  });

  const dentist = await Dentist.create({
    userId: user._id,
    name,
    email: normalizedEmail,
    qualification,
    specialization,
    experience,
    phone: contact,
    professionalLicenseNumber,
  });

  res.status(201).json({
    success: true,
    message: 'Dentist account created successfully.',
    data: {
      user: user.toPublicJSON(),
      dentist,
    },
  });
};

export const deleteDentist = async (req, res) => {
  const dentist = await Dentist.findById(req.params.id);
  if (!dentist) {
    throw new AppError('Dentist not found.', 404);
  }

  if (dentist.userId) {
    await User.findByIdAndDelete(dentist.userId);
  }
  await Dentist.findByIdAndDelete(req.params.id);

  res.json({ success: true, message: 'Dentist deleted successfully.' });
};

export const deletePharmacy = async (req, res) => {
  const pharmacy = await Pharmacy.findByIdAndDelete(req.params.id);
  if (!pharmacy) {
    throw new AppError('Pharmacy not found.', 404);
  }

  res.json({ success: true, message: 'Pharmacy deleted successfully.' });
};

// ── Dentist approval workflow (User model, role = 'dentist') ──────────────────

export const getPendingDentists = async (_req, res) => {
  const dentists = await User.find({ role: 'dentist', approvalStatus: 'pending' })
    .select('-password -refreshToken')
    .sort({ createdAt: -1 });
  res.json({ success: true, count: dentists.length, data: dentists });
};

export const approveDentist = async (req, res) => {
  const dentistUser = await User.findOneAndUpdate(
    { _id: req.params.id, role: 'dentist' },
    { approvalStatus: 'approved' },
    { new: true }
  ).select('-password -refreshToken');

  if (!dentistUser) {
    throw new AppError('Dentist not found.', 404);
  }

  // Ensure Dentist profile is created
  let dentistProfile = await Dentist.findOne({ userId: dentistUser._id });
  if (!dentistProfile) {
    dentistProfile = await Dentist.create({
      userId: dentistUser._id,
      name: dentistUser.name,
      email: dentistUser.email,
      qualification: 'Pending Verification',
      specialization: 'General Dentistry',
      experience: 0,
      phone: dentistUser.phone || 'N/A',
      professionalLicenseNumber: dentistUser.professionalLicenseNumber,
    });
  }

  res.json({ success: true, message: 'Dentist approved successfully.', data: dentistUser });
};

export const rejectDentist = async (req, res) => {
  const dentist = await User.findOneAndUpdate(
    { _id: req.params.id, role: 'dentist' },
    { approvalStatus: 'rejected' },
    { new: true }
  ).select('-password -refreshToken');

  if (!dentist) {
    throw new AppError('Dentist not found.', 404);
  }

  res.json({ success: true, message: 'Dentist rejected.', data: dentist });
};

// ── Pharmacy-user approval workflow (User model, role = 'pharmacy') ──────────

export const getPendingPharmacyUsers = async (_req, res) => {
  const pharmacyUsers = await User.find({ role: 'pharmacy', approvalStatus: 'pending' })
    .select('-password -refreshToken')
    .sort({ createdAt: -1 });
  res.json({ success: true, count: pharmacyUsers.length, data: pharmacyUsers });
};

export const approvePharmacyUser = async (req, res) => {
  const pharmacyUser = await User.findOneAndUpdate(
    { _id: req.params.id, role: 'pharmacy' },
    { approvalStatus: 'approved' },
    { new: true }
  ).select('-password -refreshToken');

  if (!pharmacyUser) {
    throw new AppError('Pharmacy user not found.', 404);
  }

  res.json({ success: true, message: 'Pharmacy user approved successfully.', data: pharmacyUser });
};

export const rejectPharmacyUser = async (req, res) => {
  const pharmacyUser = await User.findOneAndUpdate(
    { _id: req.params.id, role: 'pharmacy' },
    { approvalStatus: 'rejected' },
    { new: true }
  ).select('-password -refreshToken');

  if (!pharmacyUser) {
    throw new AppError('Pharmacy user not found.', 404);
  }

  res.json({ success: true, message: 'Pharmacy user rejected.', data: pharmacyUser });
};

export default {
  getDashboard,
  getUsers,
  updateUserRole,
  deleteUser,
  getPharmacyApplications,
  approvePharmacy,
  rejectPharmacy,
  getPharmacies,
  getDentists,
  createDentist,
  deleteDentist,
  deletePharmacy,
  getPendingDentists,
  approveDentist,
  rejectDentist,
  getPendingPharmacyUsers,
  approvePharmacyUser,
  rejectPharmacyUser,
};
