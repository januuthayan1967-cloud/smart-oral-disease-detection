import mongoose from 'mongoose';

const medicineSchema = new mongoose.Schema(
  {
    medicineName: { type: String, required: true, trim: true },
    dosage: { type: String, required: true, trim: true },
    duration: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    instructions: { type: String, default: '', trim: true },
    notes: { type: String, default: '', trim: true },
  },
  { _id: true }
);

const prescriptionSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    dentistId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Dentist',
      required: true,
    },
    medicines: {
      type: [medicineSchema],
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: 'At least one medicine is required',
      },
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid'],
      default: 'pending',
    },
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      default: null,
    },
    prescriptionFee: {
      type: Number,
      default: 500,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Prescription = mongoose.model('Prescription', prescriptionSchema);

export default Prescription;
