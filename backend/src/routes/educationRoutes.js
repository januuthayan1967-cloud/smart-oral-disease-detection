import { Router } from 'express';
import {
  getEducationContent,
  createEducationContent,
  updateEducationContent,
  deleteEducationContent,
} from '../controllers/educationController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { educationValidation } from '../middleware/validators.js';
import { asyncHandler } from '../utils/AppError.js';

const router = Router();

router.get('/', asyncHandler(getEducationContent));

router.use(protect, authorize('admin'));

router.post('/', educationValidation, validate, asyncHandler(createEducationContent));
router.put('/:id', asyncHandler(updateEducationContent));
router.delete('/:id', asyncHandler(deleteEducationContent));

export default router;
