import { Router } from 'express';
import {
  registerUser,
  registerPharmacy,
  registerDentist,
  registerPharmacyUser,
  register,
  login,
  refreshToken,
  logout,
  getProfile,
  updateProfile,
  forgotPassword,
  verifyOtp,
  resetPassword,
  verifyEmail,
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { pharmacyUpload } from '../middleware/pharmacyUpload.js';
import { validate } from '../middleware/validate.js';
import {
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  verifyOtpValidation,
  resetPasswordValidation,
  pharmacyRegisterValidation,
  dentistRegisterValidation,
  pharmacyUserRegisterValidation,
} from '../middleware/validators.js';
import { asyncHandler } from '../utils/AppError.js';

const router = Router();

router.post('/register-user', registerValidation, validate, asyncHandler(registerUser));
router.post('/register-pharmacy', pharmacyUpload.fields([
  { name: 'pharmacyLicense', maxCount: 1 },
  { name: 'businessRegistration', maxCount: 1 },
  { name: 'pharmacistQualification', maxCount: 1 },
]), pharmacyRegisterValidation, validate, asyncHandler(registerPharmacy));
router.post('/register-dentist', dentistRegisterValidation, validate, asyncHandler(registerDentist));
router.post('/register-pharmacy-user', pharmacyUserRegisterValidation, validate, asyncHandler(registerPharmacyUser));
router.post('/register', registerValidation, validate, asyncHandler(register));
router.post('/login', loginValidation, validate, asyncHandler(login));
router.post('/refresh-token', asyncHandler(refreshToken));
router.post('/forgot-password', forgotPasswordValidation, validate, asyncHandler(forgotPassword));
router.post('/verify-otp', verifyOtpValidation, validate, asyncHandler(verifyOtp));
router.post('/reset-password', resetPasswordValidation, validate, asyncHandler(resetPassword));
router.get('/verify-email', asyncHandler(verifyEmail));
router.get('/profile', protect, asyncHandler(getProfile));
router.put('/profile', protect, upload.single('profileImage'), asyncHandler(updateProfile));
router.post('/logout', protect, asyncHandler(logout));

export default router;
