import { Router } from 'express';
import { getDentists, createDentist, getDentistById } from '../controllers/dentistController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { dentistValidation } from '../middleware/validators.js';
import { asyncHandler } from '../utils/AppError.js';

const router = Router();

router.get('/', asyncHandler(getDentists));
router.get('/:id', asyncHandler(getDentistById));

export default router;
