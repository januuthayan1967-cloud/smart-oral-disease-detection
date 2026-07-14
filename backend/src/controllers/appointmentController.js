import Appointment from '../models/Appointment.js';
import Dentist from '../models/Dentist.js';
import { AppError } from '../utils/AppError.js';

const generateMeetingLink = (appointmentId) => {
  const domain = process.env.JITSI_DOMAIN || 'meet.jit.si';
  const roomName = `OralHealth-${appointmentId}`;
  return `https://${domain}/${roomName}`;
};

export const createAppointment = async (req, res) => {
  const { dentistId, appointmentDate, appointmentTime, notes } = req.body;

  const dentist = await Dentist.findById(dentistId);
  if (!dentist || !dentist.isActive) {
    throw new AppError('Dentist not found or unavailable.', 404);
  }

  const appointment = await Appointment.create({
    patientId: req.user._id,
    dentistId,
    appointmentDate,
    appointmentTime,
    notes,
    status: 'pending',
  });

  appointment.meetingLink = generateMeetingLink(appointment._id);
  await appointment.save();

  await appointment.populate([
    { path: 'patientId', select: 'name email phone' },
    { path: 'dentistId', select: 'name specialization email phone' },
  ]);

  res.status(201).json({ success: true, data: appointment });
};

export const getAppointments = async (req, res) => {
  let filter = {};

  if (req.user.role === 'admin') {
    filter = {};
  } else if (req.user.role === 'dentist') {
    const dentistProfile = await Dentist.findOne({ userId: req.user._id });
    if (dentistProfile) {
      filter = { dentistId: dentistProfile._id };
    } else {
      filter = { patientId: req.user._id };
    }
  } else {
    filter = { patientId: req.user._id };
  }

  const appointments = await Appointment.find(filter)
    .sort({ appointmentDate: -1 })
    .populate('patientId', 'name email phone')
    .populate('dentistId', 'name specialization email phone');

  res.json({ success: true, count: appointments.length, data: appointments });
};

export const updateAppointment = async (req, res) => {
  const appointment = await Appointment.findById(req.params.id);

  if (!appointment) {
    throw new AppError('Appointment not found.', 404);
  }

  const isPatient = appointment.patientId.toString() === req.user._id.toString();
  const dentistProfile = await Dentist.findOne({ userId: req.user._id });
  const isDentist =
    dentistProfile && appointment.dentistId.toString() === dentistProfile._id.toString();

  if (req.user.role !== 'admin' && !isPatient && !isDentist) {
    throw new AppError('Not authorized to update this appointment.', 403);
  }

  const allowedUpdates = ['status', 'appointmentDate', 'appointmentTime', 'notes'];
  allowedUpdates.forEach((field) => {
    if (req.body[field] !== undefined) {
      appointment[field] = req.body[field];
    }
  });

  if (!appointment.meetingLink) {
    appointment.meetingLink = generateMeetingLink(appointment._id);
  }

  await appointment.save();
  await appointment.populate([
    { path: 'patientId', select: 'name email phone' },
    { path: 'dentistId', select: 'name specialization email phone' },
  ]);

  res.json({ success: true, data: appointment });
};

export default { createAppointment, getAppointments, updateAppointment };
