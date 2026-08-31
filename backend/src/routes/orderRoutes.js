import { Router } from 'express';
import {
  getNearbyPharmacies,
  sendPrescriptionToPharmacy,
  getOrderHistory,
  getOrderById,
  getOrderTracking,
  cancelOrder,
  confirmOrder,
} from '../controllers/orderController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { orderValidation } from '../middleware/validators.js';
import { asyncHandler } from '../utils/AppError.js';

const router = Router();

router.get('/nearby', protect, authorize('user', 'admin'), asyncHandler(getNearbyPharmacies));

router.post('/send-prescription', protect, authorize('user', 'admin'), orderValidation, validate, asyncHandler(sendPrescriptionToPharmacy));
router.get('/history', protect, authorize('user', 'admin'), asyncHandler(getOrderHistory));

// Getting specific order or tracking history (checked inside controller for user, pharmacy, admin)
router.get('/:id/tracking', protect, asyncHandler(getOrderTracking));
router.get('/:id', protect, asyncHandler(getOrderById));

router.put('/:id/cancel', protect, authorize('user', 'admin'), asyncHandler(cancelOrder));
router.put('/:id/confirm', protect, authorize('user', 'admin'), asyncHandler(confirmOrder));

export default router;
