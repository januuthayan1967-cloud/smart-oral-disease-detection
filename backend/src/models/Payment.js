import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Polymorphic order reference
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    orderType: {
      type: String,
      enum: ['pharmacy_order', 'prescription', 'medicine_order'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    method: {
      type: String,
      enum: ['cod', 'card'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'cancelled'],
      default: 'pending',
    },
    // Card details — only non-sensitive fields stored
    cardHolderName: {
      type: String,
      default: '',
      trim: true,
    },
    // Only last 4 digits — never store full card number
    cardLastFour: {
      type: String,
      default: '',
      match: [/^\d{4}$|^$/, 'cardLastFour must be 4 digits'],
    },
    cardExpiry: {
      type: String,
      default: '',
      trim: true,
    },
    // Unique transaction identifier
    transactionId: {
      type: String,
      default: '',
    },
    paidAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

paymentSchema.index({ userId: 1, createdAt: -1 });
paymentSchema.index({ orderId: 1 });

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;
