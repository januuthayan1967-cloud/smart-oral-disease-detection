import { Router } from 'express';
import { getReports, getReportById, downloadReport } from '../controllers/reportController.js';
import { protect } from '../middleware/auth.js';
import { asyncHandler } from '../utils/AppError.js';

const router = Router();

router.use(protect);

router.get('/', asyncHandler(getReports));
router.get('/download/:id', asyncHandler(downloadReport));
router.get('/:id', asyncHandler(getReportById));

export default router;
