import path from 'path';
import { fileURLToPath } from 'url';
import Prediction from '../models/Prediction.js';
import Report from '../models/Report.js';
import { AppError } from '../utils/AppError.js';
import { predictDisease } from '../services/aiService.js';
import { generatePredictionReport } from '../services/pdfService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const createPrediction = async (req, res) => {
  if (!req.file) {
    throw new AppError('Please upload an oral image.', 400);
  }

  const imagePath = req.file.path;
  const imageUrl = `/uploads/${req.file.filename}`;

  const result = await predictDisease(imagePath);

  const prediction = await Prediction.create({
    userId: req.user._id,
    imageUrl,
    ...result,
  });

  const { reportPath, fileName } = await generatePredictionReport({
    user: req.user,
    prediction,
    imagePath,
  });

  const report = await Report.create({
    userId: req.user._id,
    predictionId: prediction._id,
    reportUrl: `/reports/${fileName}`,
    fileName,
  });

  res.status(201).json({
    success: true,
    data: {
      prediction,
      reportId: report._id,
      reportUrl: report.reportUrl,
    },
  });
};

export const getPredictions = async (req, res) => {
  const filter = req.user.role === 'admin' ? {} : { userId: req.user._id };

  const predictions = await Prediction.find(filter)
    .sort({ createdAt: -1 })
    .populate('userId', 'name email');

  res.json({ success: true, count: predictions.length, data: predictions });
};

export const getPredictionById = async (req, res) => {
  const prediction = await Prediction.findById(req.params.id).populate('userId', 'name email');

  if (!prediction) {
    throw new AppError('Prediction not found.', 404);
  }

  if (
    req.user.role !== 'admin' &&
    prediction.userId._id.toString() !== req.user._id.toString()
  ) {
    throw new AppError('Not authorized to view this prediction.', 403);
  }

  res.json({ success: true, data: prediction });
};

export const deletePrediction = async (req, res) => {
  const prediction = await Prediction.findById(req.params.id);

  if (!prediction) {
    throw new AppError('Prediction not found.', 404);
  }

  if (
    req.user.role !== 'admin' &&
    prediction.userId.toString() !== req.user._id.toString()
  ) {
    throw new AppError('Not authorized to delete this prediction.', 403);
  }

  await Prediction.findByIdAndDelete(req.params.id);
  await Report.deleteMany({ predictionId: req.params.id });

  res.json({ success: true, message: 'Prediction deleted successfully.' });
};

export default { createPrediction, getPredictions, getPredictionById, deletePrediction };
