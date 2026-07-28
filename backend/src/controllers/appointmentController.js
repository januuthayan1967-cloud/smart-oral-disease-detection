import Appointment from '../models/Appointment.js';
import Dentist from '../models/Dentist.js';
import { AppError } from '../utils/AppError.js';

const generateMeetingLink = (appointmentId) => {
  const domain = process.env.JITSI_DOMAIN || 'meet.jit.si';
  const roomName = `OralHealth-${appointmentId}`;
  return `https://${domain}/${roomName}`;
};

const parseTimeToMins = (timeStr) => {
  if (!timeStr) return -1;
  const clean = timeStr.trim().toUpperCase();
  const isPM = clean.includes('PM');
  const isAM = clean.includes('AM');
  const numPart = clean.replace(/(AM|PM)/g, '').trim();
  let [h, m] = numPart.split(':').map(Number);
  if (isNaN(h)) return -1;
  if (m === undefined) m = 0;
  if (isPM && h < 12) h += 12;
  if (isAM && h === 12) h = 0;
  return h * 60 + m;
};

export const createAppointment = async (req, res) => {
  const { dentistId, appointmentDate, appointmentTime, notes } = req.body;

  const dentist = await Dentist.findById(dentistId);
  if (!dentist || !dentist.isActive) {
    throw new AppError('Dentist not found or unavailable.', 404);
  }

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const apptDateObj = new Date(appointmentDate);
  const dayName = daysOfWeek[apptDateObj.getUTCDay() !== undefined ? new Date(appointmentDate + 'T00:00:00').getDay() : apptDateObj.getDay()];

  const dayAvail = (dentist.availability || []).find(
    (a) => a.day && a.day.toLowerCase() === dayName.toLowerCase()
  );

  if (!dentist.availability || dentist.availability.length === 0 || !dayAvail || !dayAvail.startTime || !dayAvail.endTime) {
    throw new AppError(
      'This dentist has not configured available appointment times. Please select another dentist or wait until the dentist updates their availability.',
      400
    );
  }

  const apptMins = parseTimeToMins(appointmentTime);
  const startMins = parseTimeToMins(dayAvail.startTime);
  const endMins = parseTimeToMins(dayAvail.endTime);

  if (apptMins < startMins || apptMins >= endMins) {
    throw new AppError(
      "The selected appointment time is outside the dentist's available hours. Please choose a time within the available schedule.",
      400
    );
  }

  // Past Time Validation for Today's Date
  const now = new Date();
  const todayYear = now.getFullYear();
  const todayMonth = String(now.getMonth() + 1).padStart(2, '0');
  const todayDay = String(now.getDate()).padStart(2, '0');
  const todayStr = `${todayYear}-${todayMonth}-${todayDay}`;

  const reqDateStr = typeof appointmentDate === 'string'
    ? appointmentDate.split('T')[0]
    : `${new Date(appointmentDate).getFullYear()}-${String(new Date(appointmentDate).getMonth() + 1).padStart(2, '0')}-${String(new Date(appointmentDate).getDate()).padStart(2, '0')}`;

  if (reqDateStr < todayStr) {
    throw new AppError(
      'The selected appointment time has already passed. Please select a future time.',
      400
    );
  }

  if (reqDateStr === todayStr) {
    const [year, month, day] = reqDateStr.split('-').map(Number);
    const hours = Math.floor(apptMins / 60);
    const minutes = apptMins % 60;
    const apptDateTime = new Date(year, month - 1, day, hours, minutes, 0, 0);

    if (apptDateTime <= now) {
      throw new AppError(
        'The selected appointment time has already passed. Please select a future time.',
        400
      );
    }
  }

  // Double Booking Protection
  const dateStart = new Date(appointmentDate);
  dateStart.setHours(0, 0, 0, 0);
  const dateEnd = new Date(appointmentDate);
  dateEnd.setHours(23, 59, 59, 999);

  const existingAppt = await Appointment.findOne({
    dentistId,
    appointmentDate: { $gte: dateStart, $lte: dateEnd },
    appointmentTime,
    status: { $ne: 'cancelled' },
  });

  if (existingAppt) {
    throw new AppError('This time slot has already been booked. Please select another available time.', 409);
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
