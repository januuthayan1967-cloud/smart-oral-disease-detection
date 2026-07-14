import { Router } from 'express';
import { getAllMedicines, getCategories } from '../controllers/medicineMarketController.js';
import { protect } from '../middleware/auth.js';
import { asyncHandler } from '../utils/AppError.js';

const router = Router();

// All authenticated users (user, dentist, admin, pharmacy) can browse medicines
router.use(protect);

router.get('/', asyncHandler(getAllMedicines));
router.get('/categories', asyncHandler(getCategories));

export default router;
