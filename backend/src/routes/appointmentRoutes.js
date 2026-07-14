import { Router } from 'express';
import {
  createAppointment,
  getAppointments,
  updateAppointment,
} from '../controllers/appointmentController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { appointmentValidation } from '../middleware/validators.js';
import { asyncHandler } from '../utils/AppError.js';

const router = Router();

router.use(protect);

router.post('/', appointmentValidation, validate, asyncHandler(createAppointment));
router.get('/', asyncHandler(getAppointments));
router.put('/:id', asyncHandler(updateAppointment));

export default router;
