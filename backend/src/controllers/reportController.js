import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Report from '../models/Report.js';
import Prediction from '../models/Prediction.js';
import { AppError } from '../utils/AppError.js';

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
  const report = await Report.findById(req.params.id);

  if (!report) {
    throw new AppError('Report not found.', 404);
  }

  if (
    req.user.role !== 'admin' &&
    report.userId.toString() !== req.user._id.toString()
  ) {
    throw new AppError('Not authorized to download this report.', 403);
  }

  const filePath = path.join(__dirname, '..', report.reportUrl);

  if (!fs.existsSync(filePath)) {
    throw new AppError('Report file not found.', 404);
  }

  res.download(filePath, report.fileName || 'oral-health-report.pdf');
};

export default { getReports, getReportById, downloadReport };
