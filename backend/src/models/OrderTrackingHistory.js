import mongoose from 'mongoose';

const orderTrackingHistorySchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    orderType: {
      type: String,
      enum: ['MedicineOrder', 'DirectOrder'],
      default: 'MedicineOrder',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'preparing', 'out_for_delivery', 'delivered', 'completed', 'cancelled'],
      required: true,
    },
    previousStatus: {
      type: String,
      enum: ['pending', 'accepted', 'preparing', 'out_for_delivery', 'delivered', 'completed', 'cancelled', null],
      default: null,
    },
    message: {
      type: String,
      default: '',
      trim: true,
    },
    actionBy: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'actionByModel',
      default: null,
    },
    actionByModel: {
      type: String,
      enum: ['User', 'Pharmacy', null],
      default: null,
    },
    actionByRole: {
      type: String,
      enum: ['user', 'pharmacy', 'dentist', 'admin', 'system'],
      default: 'system',
    },
    actionByName: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

orderTrackingHistorySchema.index({ orderId: 1, createdAt: 1 });
orderTrackingHistorySchema.index({ orderId: 1, createdAt: -1 });

const OrderTrackingHistory = mongoose.model('OrderTrackingHistory', orderTrackingHistorySchema);

export default OrderTrackingHistory;
