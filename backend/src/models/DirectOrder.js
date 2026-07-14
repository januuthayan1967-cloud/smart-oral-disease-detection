import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema(
  {
    inventoryItemId: { type: mongoose.Schema.Types.ObjectId },
    medicineName: { type: String, required: true },
    category: { type: String, default: 'General' },
    image: { type: String, default: '' },
    unitPrice: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    totalPrice: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const directOrderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    pharmacyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pharmacy',
      required: true,
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (v) => v.length > 0,
        message: 'Order must contain at least one item.',
      },
    },
    customerName: { type: String, required: true, trim: true },
    deliveryAddress: { type: String, required: true, trim: true },
    contactNumber: { type: String, required: true, trim: true },
    notes: { type: String, default: '', trim: true },
    totalAmount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'preparing', 'out_for_delivery', 'delivered', 'completed', 'cancelled'],
      default: 'pending',
    },
    deliveryConfirmed: {
      type: Boolean,
      default: false,
    },
    rejectionReason: { type: String, default: '' },
    paymentMethod: {
      type: String,
      enum: ['cod', 'card'],
      default: 'cod',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'cancelled'],
      default: 'pending',
    },
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      default: null,
    },
  },
  { timestamps: true }
);

// Index for pharmacy queries
directOrderSchema.index({ pharmacyId: 1, createdAt: -1 });
directOrderSchema.index({ userId: 1, createdAt: -1 });

const DirectOrder = mongoose.model('DirectOrder', directOrderSchema);

export default DirectOrder;
