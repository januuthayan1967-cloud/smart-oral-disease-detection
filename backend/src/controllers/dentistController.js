import Dentist from '../models/Dentist.js';
import { AppError } from '../utils/AppError.js';

export const getDentists = async (req, res) => {
  const filter = { isActive: true };

  if (req.query.specialization) {
    filter.specialization = new RegExp(req.query.specialization, 'i');
  }

  if (req.query.search) {
    filter.name = new RegExp(req.query.search, 'i');
  }

  const dentists = await Dentist.find(filter).sort({ name: 1 });

  res.json({ success: true, count: dentists.length, data: dentists });
};

export const createDentist = async (req, res) => {
  const dentist = await Dentist.create({
    ...req.body,
    userId: req.user._id,
  });

  if (req.user.role === 'dentist') {
    req.user.role = 'dentist';
    await req.user.save({ validateBeforeSave: false });
  }

  res.status(201).json({ success: true, data: dentist });
};

export const getDentistById = async (req, res) => {
  const dentist = await Dentist.findById(req.params.id);

  if (!dentist) {
    throw new AppError('Dentist not found.', 404);
  }

  res.json({ success: true, data: dentist });
};

export default { getDentists, createDentist, getDentistById };
