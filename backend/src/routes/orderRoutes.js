import { Router } from 'express';
import {
  getNearbyPharmacies,
  sendPrescriptionToPharmacy,
  getOrderHistory,
  getOrderById,
  cancelOrder,
  confirmOrder,
} from '../controllers/orderController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { orderValidation } from '../middleware/validators.js';
import { asyncHandler } from '../utils/AppError.js';

const router = Router();

router.get('/nearby', protect, authorize('user', 'admin'), asyncHandler(getNearbyPharmacies));

router.use(protect, authorize('user', 'admin'));

router.post('/send-prescription', orderValidation, validate, asyncHandler(sendPrescriptionToPharmacy));
router.get('/history', asyncHandler(getOrderHistory));
router.get('/:id', asyncHandler(getOrderById));
router.put('/:id/cancel', asyncHandler(cancelOrder));
router.put('/:id/confirm', asyncHandler(confirmOrder));

export default router;
