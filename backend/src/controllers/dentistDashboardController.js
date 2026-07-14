import Dentist from '../models/Dentist.js';
import Appointment from '../models/Appointment.js';
import Prediction from '../models/Prediction.js';
import Prescription from '../models/Prescription.js';
import User from '../models/User.js';
import Payment from '../models/Payment.js';
import { AppError } from '../utils/AppError.js';

const getDentistProfile = async (userId) => {
  const dentist = await Dentist.findOne({ userId });
  if (!dentist) {
    throw new AppError('Dentist profile not found.', 404);
  }
  return dentist;
};

export const getMyPatients = async (req, res) => {
  const dentist = await getDentistProfile(req.user._id);

  const appointments = await Appointment.find({ dentistId: dentist._id })
    .populate('patientId', 'name email phone age gender')
    .sort({ appointmentDate: -1 });

  const patientMap = new Map();
  appointments.forEach((appt) => {
    if (appt.patientId) {
      patientMap.set(appt.patientId._id.toString(), appt.patientId);
    }
  });

  res.json({ success: true, count: patientMap.size, data: Array.from(patientMap.values()) });
};

export const getMyConsultations = async (req, res) => {
  const dentist = await getDentistProfile(req.user._id);

  const appointments = await Appointment.find({ dentistId: dentist._id })
    .sort({ appointmentDate: -1 })
    .populate('patientId', 'name email phone');

  res.json({ success: true, count: appointments.length, data: appointments });
};

export const getPatientHistory = async (req, res) => {
  const dentist = await getDentistProfile(req.user._id);
  const { patientId } = req.params;

  const hasAppointment = await Appointment.findOne({
    dentistId: dentist._id,
    patientId,
  });

  if (!hasAppointment) {
    throw new AppError('Not authorized to view this patient history.', 403);
  }

  const [patient, predictions, appointments, prescriptions] = await Promise.all([
    User.findById(patientId).select('name email phone age gender'),
    Prediction.find({ userId: patientId }).sort({ createdAt: -1 }),
    Appointment.find({ patientId, dentistId: dentist._id }).sort({ appointmentDate: -1 }),
    Prescription.find({ patientId, dentistId: dentist._id })
      .sort({ createdAt: -1 })
      .populate('dentistId', 'name specialization'),
  ]);

  res.json({
    success: true,
    data: { patient, predictions, appointments, prescriptions },
  });
};

export const updateAvailability = async (req, res) => {
  const dentist = await getDentistProfile(req.user._id);
  dentist.availability = req.body.availability || [];
  await dentist.save();

  res.json({ success: true, data: dentist });
};

export const getMyProfile = async (req, res) => {
  const dentist = await getDentistProfile(req.user._id);
  res.json({ success: true, data: dentist });
};

export const updateMyProfile = async (req, res) => {
  const dentist = await getDentistProfile(req.user._id);
  const allowedFields = ['name', 'qualification', 'specialization', 'experience', 'phone', 'bio'];

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      dentist[field] = req.body[field];
    }
  });

  await dentist.save();
  res.json({ success: true, data: dentist });
};

export const getMyPayments = async (req, res) => {
  const dentist = await getDentistProfile(req.user._id);

  // Find all prescriptions for this dentist
  const prescriptions = await Prescription.find({ dentistId: dentist._id }).select('_id');
  const prescriptionIds = prescriptions.map((p) => p._id);

  // Find all payments that reference these prescriptions
  const payments = await Payment.find({
    orderId: { $in: prescriptionIds },
    orderType: 'prescription',
    status: 'paid',
  })
    .sort({ createdAt: -1 })
    .populate('userId', 'name email phone');

  res.json({ success: true, count: payments.length, data: payments });
};

export default {
  getMyPatients,
  getMyConsultations,
  getPatientHistory,
  updateAvailability,
  getMyProfile,
  updateMyProfile,
  getMyPayments,
};
