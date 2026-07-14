import { Router } from 'express';
import {
  createPrescription,
  getPrescriptionsByPatient,
  getMyPrescriptions,
  getPrescriptionById,
  downloadPrescription,
} from '../controllers/prescriptionController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { prescriptionValidation } from '../middleware/validators.js';
import { asyncHandler } from '../utils/AppError.js';

const router = Router();

router.use(protect);

router.post('/', authorize('dentist'), prescriptionValidation, validate, asyncHandler(createPrescription));
router.get('/my', authorize('user'), asyncHandler(getMyPrescriptions));
router.get('/patient/:patientId', authorize('user', 'dentist', 'admin'), asyncHandler(getPrescriptionsByPatient));
router.get('/:id/download', authorize('user', 'admin'), asyncHandler(downloadPrescription));
router.get('/:id', asyncHandler(getPrescriptionById));

export default router;
