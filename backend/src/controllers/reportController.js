import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Report from '../models/Report.js';
import Prediction from '../models/Prediction.js';
import { AppError } from '../utils/AppError.js';
import { generatePredictionReportBuffer } from '../services/pdfService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const getReports = async (req, res) => {
  const filter = req.user.role === 'admin' ? {} : { userId: req.user._id };

  const reports = await Report.find(filter)
    .sort({ generatedAt: -1 })
    .populate('predictionId')
    .populate('userId', 'name email');

  res.json({ success: true, count: reports.length, data: reports });
};

export const getReportById = async (req, res) => {
  const report = await Report.findById(req.params.id)
    .populate('predictionId')
    .populate('userId', 'name email');

  if (!report) {
    throw new AppError('Report not found.', 404);
  }

  if (
    req.user.role !== 'admin' &&
    report.userId._id.toString() !== req.user._id.toString()
  ) {
    throw new AppError('Not authorized to view this report.', 403);
  }

  res.json({ success: true, data: report });
};

export const downloadReport = async (req, res) => {
  // `id` can be either Report ID or Prediction ID
  let report = await Report.findById(req.params.id).populate('predictionId');
  let prediction = null;

  if (report) {
    if (
      req.user.role !== 'admin' &&
      report.userId.toString() !== req.user._id.toString()
    ) {
      throw new AppError('Not authorized to download this report.', 403);
    }
    prediction = await Prediction.findById(report.predictionId).populate('userId', 'name email age gender');
  } else {
    // Attempt lookup as Prediction ID directly
    prediction = await Prediction.findById(req.params.id).populate('userId', 'name email age gender');
    if (!prediction) {
      throw new AppError('Report not found.', 404);
    }
    if (
      req.user.role !== 'admin' &&
      prediction.userId._id.toString() !== req.user._id.toString()
    ) {
      throw new AppError('Not authorized to download this report.', 403);
    }
  }

  let localImagePath = null;
  if (prediction && prediction.imageUrl) {
    const filename = path.basename(prediction.imageUrl);
    const possiblePath = path.join(__dirname, '..', 'uploads', filename);
    if (fs.existsSync(possiblePath)) {
      localImagePath = possiblePath;
    }
  }

  const pdfBuffer = await generatePredictionReportBuffer({
    user: prediction.userId || req.user,
    prediction,
    imageSource: localImagePath,
  });

  const fileName = report?.fileName || `ai-prediction-report-${prediction._id}.pdf`;
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
  res.send(pdfBuffer);
};

export default { getReports, getReportById, downloadReport };
