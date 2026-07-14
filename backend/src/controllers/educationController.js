import Education from '../models/Education.js';
import { AppError } from '../utils/AppError.js';

export const getEducationContent = async (req, res) => {
  const filter = {};

  if (req.query.category) {
    filter.category = req.query.category;
  }

  const contents = await Education.find(filter).sort({ createdAt: -1 });

  res.json({ success: true, count: contents.length, data: contents });
};

export const createEducationContent = async (req, res) => {
  const content = await Education.create({
    ...req.body,
    createdBy: req.user._id,
  });

  res.status(201).json({ success: true, data: content });
};

export const updateEducationContent = async (req, res) => {
  const content = await Education.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!content) {
    throw new AppError('Content not found.', 404);
  }

  res.json({ success: true, data: content });
};

export const deleteEducationContent = async (req, res) => {
  const content = await Education.findByIdAndDelete(req.params.id);

  if (!content) {
    throw new AppError('Content not found.', 404);
  }

  res.json({ success: true, message: 'Content deleted successfully.' });
};

export default {
  getEducationContent,
  createEducationContent,
  updateEducationContent,
  deleteEducationContent,
};
