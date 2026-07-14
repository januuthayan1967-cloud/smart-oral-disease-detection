import { Router } from 'express';
import {
  getDashboard,
  getUsers,
  updateUserRole,
  deleteUser,
  getPharmacyApplications,
  approvePharmacy,
  rejectPharmacy,
  getPharmacies,
  getDentists,
  createDentist,
  deleteDentist,
  deletePharmacy,
  getPendingDentists,
  approveDentist,
  rejectDentist,
  getPendingPharmacyUsers,
  approvePharmacyUser,
  rejectPharmacyUser,
} from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { adminDentistValidation } from '../middleware/validators.js';
import { asyncHandler } from '../utils/AppError.js';

const router = Router();

router.use(protect, authorize('admin'));

router.get('/dashboard', asyncHandler(getDashboard));
router.get('/users', asyncHandler(getUsers));
router.put('/users/:id/role', asyncHandler(updateUserRole));
router.delete('/users/:id', asyncHandler(deleteUser));

router.get('/pharmacy-applications', asyncHandler(getPharmacyApplications));
router.put('/pharmacy-approve/:id', asyncHandler(approvePharmacy));
router.put('/pharmacy-reject/:id', asyncHandler(rejectPharmacy));
router.get('/pharmacies', asyncHandler(getPharmacies));
router.delete('/pharmacies/:id', asyncHandler(deletePharmacy));

router.get('/dentists', asyncHandler(getDentists));
router.post('/dentists', adminDentistValidation, validate, asyncHandler(createDentist));
router.delete('/dentists/:id', asyncHandler(deleteDentist));

// ── Dentist approval workflow (User model) ───────────────────────────────────
router.get('/pending-dentists', asyncHandler(getPendingDentists));
router.put('/approve-dentist/:id', asyncHandler(approveDentist));
router.put('/reject-dentist/:id', asyncHandler(rejectDentist));

// ── Pharmacy-user approval workflow (User model) ─────────────────────────────
router.get('/pending-pharmacies', asyncHandler(getPendingPharmacyUsers));
router.put('/approve-pharmacy/:id', asyncHandler(approvePharmacyUser));
router.put('/reject-pharmacy/:id', asyncHandler(rejectPharmacyUser));

export default router;
