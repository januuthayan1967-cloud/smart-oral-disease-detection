import { Router } from 'express';
import {
  getMyPatients,
  getMyConsultations,
  getPatientHistory,
  updateAvailability,
  getMyProfile,
  updateMyProfile,
  getMyPayments,
} from '../controllers/dentistDashboardController.js';
import { protect, authorize } from '../middleware/auth.js';
import { asyncHandler } from '../utils/AppError.js';

const router = Router();

router.use(protect, authorize('dentist'));

router.get('/patients', asyncHandler(getMyPatients));
router.get('/consultations', asyncHandler(getMyConsultations));
router.get('/patients/:patientId/history', asyncHandler(getPatientHistory));
router.put('/availability', asyncHandler(updateAvailability));
router.get('/profile', asyncHandler(getMyProfile));
router.put('/profile', asyncHandler(updateMyProfile));
router.get('/payments', asyncHandler(getMyPayments));

export default router;
