import { Router } from 'express';
import { getCart, addToCart, updateCartItem, removeFromCart, clearCart } from '../controllers/cartController.js';
import { protect, authorize } from '../middleware/auth.js';
import { asyncHandler } from '../utils/AppError.js';

const router = Router();

// Cart is accessible by user, dentist, and admin
router.use(protect, authorize('user', 'dentist', 'admin'));

router.route('/')
  .get(asyncHandler(getCart))
  .post(asyncHandler(addToCart))
  .delete(asyncHandler(clearCart));

router.route('/:itemId')
  .put(asyncHandler(updateCartItem))
  .delete(asyncHandler(removeFromCart));

export default router;
