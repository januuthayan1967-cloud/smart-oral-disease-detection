import Prescription from '../models/Prescription.js';
import Dentist from '../models/Dentist.js';
import User from '../models/User.js';
import Payment from '../models/Payment.js';
import { AppError } from '../utils/AppError.js';
import PDFDocument from 'pdfkit';

export const createPrescription = async (req, res) => {
  const dentistProfile = await Dentist.findOne({ userId: req.user._id });
  if (!dentistProfile) {
    throw new AppError('Dentist profile not found.', 404);
  }

  const patient = await User.findById(req.body.patientId);
  if (!patient || patient.role !== 'user') {
    throw new AppError('Patient not found.', 404);
  }

  const prescription = await Prescription.create({
    patientId: req.body.patientId,
    dentistId: dentistProfile._id,
    medicines: req.body.medicines,
    notes: req.body.notes || '',
    caseDiagnosis: req.body.caseDiagnosis || '',
    date: req.body.date || new Date(),
    prescriptionFee: req.body.prescriptionFee !== undefined ? Number(req.body.prescriptionFee) : 500,
  });

  await prescription.populate([
    { path: 'patientId', select: 'name email phone age gender' },
    { path: 'dentistId', select: 'name specialization qualification' },
  ]);

  res.status(201).json({ success: true, data: prescription });
};

export const getPrescriptionsByPatient = async (req, res) => {
  const { patientId } = req.params;

  if (req.user.role === 'user' && req.user._id.toString() !== patientId) {
    throw new AppError('Not authorized to view these prescriptions.', 403);
  }

  if (req.user.role === 'dentist') {
    const dentistProfile = await Dentist.findOne({ userId: req.user._id });
    if (!dentistProfile) {
      throw new AppError('Dentist profile not found.', 404);
    }
    const prescriptions = await Prescription.find({
      patientId,
      dentistId: dentistProfile._id,
    })
      .sort({ createdAt: -1 })
      .populate('patientId', 'name email phone')
      .populate('dentistId', 'name specialization');

    return res.json({ success: true, count: prescriptions.length, data: prescriptions });
  }

  const prescriptions = await Prescription.find({ patientId })
    .sort({ createdAt: -1 })
    .populate('patientId', 'name email phone')
    .populate('dentistId', 'name specialization');

  res.json({ success: true, count: prescriptions.length, data: prescriptions });
};

export const getMyPrescriptions = async (req, res) => {
  const prescriptions = await Prescription.find({ patientId: req.user._id })
    .sort({ createdAt: -1 })
    .populate('dentistId', 'name specialization qualification');

  res.json({ success: true, count: prescriptions.length, data: prescriptions });
};

export const getPrescriptionById = async (req, res) => {
  const prescription = await Prescription.findById(req.params.id)
    .populate('patientId', 'name email phone')
    .populate('dentistId', 'name specialization');

  if (!prescription) {
    throw new AppError('Prescription not found.', 404);
  }

  const isOwner = prescription.patientId._id.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (req.user.role === 'dentist') {
    const dentistProfile = await Dentist.findOne({ userId: req.user._id });
    const isDentist =
      dentistProfile && prescription.dentistId._id.toString() === dentistProfile._id.toString();
    if (!isDentist && !isAdmin) {
      throw new AppError('Not authorized.', 403);
    }
  } else if (!isOwner && !isAdmin) {
    throw new AppError('Not authorized.', 403);
  }

  res.json({ success: true, data: prescription });
};

export const downloadPrescription = async (req, res) => {
  const prescription = await Prescription.findById(req.params.id)
    .populate('patientId', 'name email phone age gender')
    .populate('dentistId', 'name specialization qualification');

  if (!prescription) throw new AppError('Prescription not found.', 404);

  // Only the patient (or admin) can download
  const isOwner = prescription.patientId._id.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';
  if (!isOwner && !isAdmin) throw new AppError('Not authorized.', 403);

  // Enforce payment gate
  if (!isAdmin) {
    if (prescription.paymentStatus !== 'paid') {
      throw new AppError('Payment is required before downloading this prescription.', 402);
    }
    const verifiedPayment = await Payment.findOne({
      orderId: prescription._id,
      userId: req.user._id,
      orderType: 'prescription',
      status: 'paid',
    });
    if (!verifiedPayment) {
      throw new AppError('Payment verification failed. A confirmed payment is required before downloading this prescription.', 402);
    }
  }

  // Generate PDF
  const doc = new PDFDocument({ margin: 50 });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="prescription-${prescription._id}.pdf"`
  );

  doc.pipe(res);

  // ----- Header -----
  doc
    .fontSize(22)
    .font('Helvetica-Bold')
    .text('Smart Oral Disease Detection', { align: 'center' });
  doc
    .fontSize(12)
    .font('Helvetica')
    .text('Medical Prescription', { align: 'center' });
  doc.moveDown(0.5);
  doc
    .strokeColor('#cccccc')
    .lineWidth(1)
    .moveTo(50, doc.y)
    .lineTo(550, doc.y)
    .stroke();
  doc.moveDown(1);

  // ----- Dentist Info -----
  doc.font('Helvetica-Bold').fontSize(13).text('Prescribing Dentist');
  doc.font('Helvetica').fontSize(11);
  doc.text(`Name: Dr. ${prescription.dentistId?.name || 'N/A'}`);
  doc.text(`Specialization: ${prescription.dentistId?.specialization || 'N/A'}`);
  if (prescription.dentistId?.qualification) {
    doc.text(`Qualification: ${prescription.dentistId.qualification}`);
  }
  doc.moveDown(1);

  // ----- Patient Info -----
  doc.font('Helvetica-Bold').fontSize(13).text('Patient Information');
  doc.font('Helvetica').fontSize(11);
  doc.text(`Name: ${prescription.patientId?.name || 'N/A'}`);
  doc.text(`Email: ${prescription.patientId?.email || 'N/A'}`);
  if (prescription.patientId?.phone) doc.text(`Phone: ${prescription.patientId.phone}`);
  if (prescription.patientId?.age) doc.text(`Age: ${prescription.patientId.age}`);
  if (prescription.patientId?.gender) doc.text(`Gender: ${prescription.patientId.gender}`);
  doc.text(`Date: ${new Date(prescription.date || prescription.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}`);
  doc.text(`Case / Diagnosis: ${prescription.caseDiagnosis || 'Not specified'}`);
  doc.moveDown(1);

  // ----- Medicines -----
  doc
    .strokeColor('#cccccc')
    .lineWidth(1)
    .moveTo(50, doc.y)
    .lineTo(550, doc.y)
    .stroke();
  doc.moveDown(0.5);
  doc.font('Helvetica-Bold').fontSize(13).text('Prescribed Medicines');
  doc.moveDown(0.5);

  prescription.medicines.forEach((med, i) => {
    doc.font('Helvetica-Bold').fontSize(11).text(`${i + 1}. ${med.medicineName}`);
    doc.font('Helvetica').fontSize(10);
    doc.text(`   Dosage: ${med.dosage}   |   Duration: ${med.duration}   |   Quantity: ${med.quantity}`);
    if (med.instructions) doc.text(`   Instructions: ${med.instructions}`);
    if (med.notes) doc.text(`   Notes: ${med.notes}`);
    doc.moveDown(0.5);
  });

  // ----- Doctor Notes -----
  if (prescription.notes) {
    doc
      .strokeColor('#cccccc')
      .lineWidth(1)
      .moveTo(50, doc.y)
      .lineTo(550, doc.y)
      .stroke();
    doc.moveDown(0.5);
    doc.font('Helvetica-Bold').fontSize(12).text('Doctor Notes:');
    doc.font('Helvetica').fontSize(11).text(prescription.notes);
    doc.moveDown(1);
  }

  // ----- Footer -----
  doc.moveDown(2);
  doc
    .strokeColor('#cccccc')
    .lineWidth(1)
    .moveTo(50, doc.y)
    .lineTo(550, doc.y)
    .stroke();
  doc.moveDown(0.5);
  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor('#888888')
    .text(
      `Generated on ${new Date().toLocaleString('en-IN')} | Transaction verified | Prescription ID: ${prescription._id}`,
      { align: 'center' }
    );

  doc.end();
};

export default {
  createPrescription,
  getPrescriptionsByPatient,
  getMyPrescriptions,
  getPrescriptionById,
  downloadPrescription,
};
