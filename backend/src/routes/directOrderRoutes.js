import { Router } from 'express';
import {
  placeOrder,
  getMyOrders,
  getOrderById,
  getDirectOrderTracking,
  cancelOrder,
  confirmOrder,
} from '../controllers/directOrderController.js';
import { protect, authorize } from '../middleware/auth.js';
import { asyncHandler } from '../utils/AppError.js';

const router = Router();

// Protect all routes
router.use(protect);

// Placements and listing history is for customers (user, dentist, admin)
router.post('/', authorize('user', 'dentist', 'admin'), asyncHandler(placeOrder));
router.get('/', authorize('user', 'dentist', 'admin'), asyncHandler(getMyOrders));

// Getting specific order tracking history or order details can be done by customer, pharmacy, or admin
router.get('/:id/tracking', asyncHandler(getDirectOrderTracking));
router.get('/:id', asyncHandler(getOrderById));

// Cancelling order is for customer (user, dentist, admin)
router.put('/:id/cancel', authorize('user', 'dentist', 'admin'), asyncHandler(cancelOrder));

// Confirming order receipt is for customer (user, dentist, admin)
router.put('/:id/confirm', authorize('user', 'dentist', 'admin'), asyncHandler(confirmOrder));

export default router;
