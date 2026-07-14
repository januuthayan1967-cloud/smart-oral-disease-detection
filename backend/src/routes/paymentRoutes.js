import { Router } from 'express';
import {
  processPharmacyPayment,
  processPrescriptionPayment,
  getMyPayments,
} from '../controllers/paymentController.js';
import { protect, authorize } from '../middleware/auth.js';
import { asyncHandler } from '../utils/AppError.js';

const router = Router();

router.use(protect);

// All payment routes restricted to user, dentist, admin (not pharmacy)
router.use(authorize('user', 'dentist', 'admin'));

router.post('/pharmacy-order', asyncHandler(processPharmacyPayment));
router.post('/prescription', asyncHandler(processPrescriptionPayment));
router.get('/my', asyncHandler(getMyPayments));

export default router;
