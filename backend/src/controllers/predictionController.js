import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Prediction from '../models/Prediction.js';
import Report from '../models/Report.js';
import { AppError } from '../utils/AppError.js';
import { predictDisease } from '../services/aiService.js';
import { generatePredictionReportBuffer } from '../services/pdfService.js';
import { evaluatePredictionRisk } from '../utils/riskRules.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const createPrediction = async (req, res) => {
  if (!req.file) {
    throw new AppError('Please upload an oral image.', 400);
  }

  const imagePath = req.file.path;
  const imageUrl = `/uploads/${req.file.filename}`;

  const result = await predictDisease(imagePath);

  // Evaluate risk level & standardized keys via business rules
  const riskEval = evaluatePredictionRisk(result.diseaseName, result.confidence);

  const prediction = await Prediction.create({
    userId: req.user._id,
    imageUrl,
    ...result,
    predictedClass: riskEval.rawClass,
    displayName: riskEval.displayName,
    confidencePercentage: Math.round(result.confidence || 0),
    riskLevel: riskEval.riskLevel,
    riskReason: riskEval.riskReason,
  });

  const reportFileName = `ai-prediction-report-${prediction._id}.pdf`;
  const report = await Report.create({
    userId: req.user._id,
    predictionId: prediction._id,
    reportUrl: `/api/predictions/${prediction._id}/report`,
    fileName: reportFileName,
  });

  res.status(201).json({
    success: true,
    data: {
      predictionId: prediction._id,
      predictedClass: prediction.predictedClass,
      displayName: prediction.displayName,
      confidence: prediction.confidence,
      confidencePercentage: prediction.confidencePercentage,
      riskLevel: prediction.riskLevel,
      riskReason: prediction.riskReason,
      explanation: prediction.description,
      recommendation: prediction.recommendation,
      createdAt: prediction.createdAt,
      imageUrl: prediction.imageUrl,
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

  // Backwards compatible map ensuring all standardized keys are present
  const standardizedPredictions = predictions.map((p) => {
    const riskEval = evaluatePredictionRisk(p.diseaseName, p.confidence);
    const obj = p.toObject();
    return {
      ...obj,
      predictionId: p._id,
      predictedClass: p.predictedClass || riskEval.rawClass,
      displayName: p.displayName || p.diseaseName || riskEval.displayName,
      confidencePercentage: p.confidencePercentage || Math.round(p.confidence || 0),
      riskLevel: p.riskLevel || riskEval.riskLevel,
      riskReason: p.riskReason || riskEval.riskReason,
      explanation: p.description,
    };
  });

  res.json({ success: true, count: standardizedPredictions.length, data: standardizedPredictions });
};

export const getPredictionById = async (req, res) => {
  const prediction = await Prediction.findById(req.params.id).populate('userId', 'name email age gender');

  if (!prediction) {
    throw new AppError('Prediction not found.', 404);
  }

  if (
    req.user.role !== 'admin' &&
    prediction.userId._id.toString() !== req.user._id.toString()
  ) {
    throw new AppError('Not authorized to view this prediction.', 403);
  }

  const riskEval = evaluatePredictionRisk(prediction.diseaseName, prediction.confidence);
  const obj = prediction.toObject();
  const standardized = {
    ...obj,
    predictionId: prediction._id,
    predictedClass: prediction.predictedClass || riskEval.rawClass,
    displayName: prediction.displayName || prediction.diseaseName || riskEval.displayName,
    confidencePercentage: prediction.confidencePercentage || Math.round(prediction.confidence || 0),
    riskLevel: prediction.riskLevel || riskEval.riskLevel,
    riskReason: prediction.riskReason || riskEval.riskReason,
    explanation: prediction.description,
  };

  res.json({ success: true, data: standardized });
};

export const downloadPredictionReport = async (req, res) => {
  const prediction = await Prediction.findById(req.params.id).populate('userId', 'name email age gender');

  if (!prediction) {
    throw new AppError('Prediction not found.', 404);
  }

  if (
    req.user.role !== 'admin' &&
    prediction.userId._id.toString() !== req.user._id.toString()
  ) {
    throw new AppError('Not authorized to access this report.', 403);
  }

  let localImagePath = null;
  if (prediction.imageUrl) {
    const filename = path.basename(prediction.imageUrl);
    const possiblePath = path.join(__dirname, '..', 'uploads', filename);
    if (fs.existsSync(possiblePath)) {
      localImagePath = possiblePath;
    }
  }

  const pdfBuffer = await generatePredictionReportBuffer({
    user: prediction.userId,
    prediction,
    imageSource: localImagePath,
  });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="ai-prediction-report-${prediction._id}.pdf"`
  );
  res.send(pdfBuffer);
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

export default {
  createPrediction,
  getPredictions,
  getPredictionById,
  downloadPredictionReport,
  deletePrediction,
};
