import { Router } from 'express';
import {
  createPrediction,
  getPredictions,
  getPredictionById,
  deletePrediction,
} from '../controllers/predictionController.js';
import { protect } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { asyncHandler } from '../utils/AppError.js';

const router = Router();

router.use(protect);

router.post('/', upload.single('image'), asyncHandler(createPrediction));
router.get('/', asyncHandler(getPredictions));
router.get('/:id', asyncHandler(getPredictionById));
router.delete('/:id', asyncHandler(deletePrediction));

export default router;
