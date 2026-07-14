import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    predictionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Prediction',
      required: true,
    },
    reportUrl: {
      type: String,
      required: true,
    },
    fileName: String,
  },
  {
    timestamps: { createdAt: 'generatedAt', updatedAt: false },
  }
);

const Report = mongoose.model('Report', reportSchema);

export default Report;
