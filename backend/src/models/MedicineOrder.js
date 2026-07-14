import mongoose from 'mongoose';

const medicineOrderSchema = new mongoose.Schema(
  {
    prescriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Prescription',
      required: true,
    },
    pharmacyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pharmacy',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'preparing', 'out_for_delivery', 'delivered', 'completed', 'cancelled'],
      default: 'pending',
    },
    deliveryConfirmed: {
      type: Boolean,
      default: false,
    },
    totalAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    deliveryAddress: {
      type: String,
      required: true,
      trim: true,
    },
    rejectionReason: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

const MedicineOrder = mongoose.model('MedicineOrder', medicineOrderSchema);

export default MedicineOrder;
