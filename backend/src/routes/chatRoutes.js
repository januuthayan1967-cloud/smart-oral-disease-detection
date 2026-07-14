import { Router } from 'express';
import { sendMessage, getChatHistory } from '../controllers/chatController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { chatValidation } from '../middleware/validators.js';
import { asyncHandler } from '../utils/AppError.js';

const router = Router();

router.use(protect);

router.post('/', chatValidation, validate, asyncHandler(sendMessage));
router.get('/history', asyncHandler(getChatHistory));

export default router;
