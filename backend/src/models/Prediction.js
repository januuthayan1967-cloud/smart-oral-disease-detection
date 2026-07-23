import mongoose from 'mongoose';

const predictionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    imageUrl: {
      type: String,
      required: true,
    },
    diseaseName: {
      type: String,
      required: true,
    },
    predictedClass: {
      type: String,
      default: function () {
        return this.diseaseName ? this.diseaseName.toLowerCase().replace(/\s+/g, '_') : '';
      },
    },
    displayName: {
      type: String,
      default: function () {
        return this.diseaseName || '';
      },
    },
    confidence: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    confidencePercentage: {
      type: Number,
      default: function () {
        return this.confidence != null ? Math.round(this.confidence) : 0;
      },
    },
    riskLevel: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH'],
      default: 'LOW',
    },
    riskReason: String,
    severity: {
      type: String,
      enum: ['Low', 'Moderate', 'High', 'None'],
      default: 'Low',
    },
    probabilities: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    description: String,
    causes: [String],
    treatmentSuggestions: [String],
    preventionTips: [String],
    recommendation: String,
  },
  {
    timestamps: true,
  }
);

const Prediction = mongoose.model('Prediction', predictionSchema);

export default Prediction;
