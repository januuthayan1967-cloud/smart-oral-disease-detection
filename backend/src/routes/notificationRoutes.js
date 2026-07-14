import { Router } from 'express';
import { getMyNotifications, markAsRead, markAllRead } from '../controllers/notificationController.js';
import { protect } from '../middleware/auth.js';
import { asyncHandler } from '../utils/AppError.js';

const router = Router();

router.use(protect);

router.get('/', asyncHandler(getMyNotifications));
router.patch('/read-all', asyncHandler(markAllRead));
router.patch('/:id/read', asyncHandler(markAsRead));

export default router;
