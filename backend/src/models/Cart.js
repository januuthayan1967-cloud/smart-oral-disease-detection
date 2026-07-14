import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema(
  {
    pharmacyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pharmacy',
      required: true,
    },
    pharmacyName: { type: String, required: true },
    inventoryItemId: { type: mongoose.Schema.Types.ObjectId, required: true },
    medicineName: { type: String, required: true },
    category: { type: String, default: 'General' },
    image: { type: String, default: '' },
    unitPrice: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1, default: 1 },
  },
  { _id: true }
);

cartItemSchema.virtual('totalPrice').get(function () {
  return this.unitPrice * this.quantity;
});

const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    items: [cartItemSchema],
  },
  { timestamps: true }
);

const Cart = mongoose.model('Cart', cartSchema);

export default Cart;
