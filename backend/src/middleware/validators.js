import { body } from 'express-validator';

export const registerValidation = [
  body('name').trim().notEmpty().withMessage('Full name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').optional().isMobilePhone('any').withMessage('Valid phone number required'),
  body('age').optional().isInt({ min: 1, max: 120 }).withMessage('Age must be between 1 and 120'),
  body('gender')
    .optional()
    .isIn(['male', 'female', 'other', 'prefer_not_to_say'])
    .withMessage('Invalid gender'),
];

export const loginValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

export const forgotPasswordValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
];

export const verifyOtpValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
];

export const resetPasswordValidation = [
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

export const chatValidation = [
  body('message').trim().notEmpty().withMessage('Message is required'),
];

export const educationValidation = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('category')
    .isIn(['articles', 'tips', 'brushing', 'flossing', 'mouthwash', 'prevention', 'video'])
    .withMessage('Invalid category'),
  body('description').trim().notEmpty().withMessage('Description is required'),
];

export const appointmentValidation = [
  body('dentistId').notEmpty().withMessage('Dentist ID is required'),
  body('appointmentDate').isISO8601().withMessage('Valid appointment date is required'),
  body('appointmentTime').notEmpty().withMessage('Appointment time is required'),
];

export const dentistValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('qualification').trim().notEmpty().withMessage('Qualification is required'),
  body('specialization').trim().notEmpty().withMessage('Specialization is required'),
  body('experience').isInt({ min: 0 }).withMessage('Experience must be a positive number'),
  body('phone').notEmpty().withMessage('Phone is required'),
  body('email').isEmail().withMessage('Valid email is required'),
];

export const pharmacyRegisterValidation = [
  body('pharmacyName').trim().notEmpty().withMessage('Pharmacy name is required'),
  body('ownerName').trim().notEmpty().withMessage('Owner name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').notEmpty().withMessage('Phone number is required'),
  body('address').trim().notEmpty().withMessage('Address is required'),
  body('district').trim().notEmpty().withMessage('District is required'),
  body('city').trim().notEmpty().withMessage('City is required'),
  body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude is required'),
  body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude is required'),
  body('licenseNumber').trim().notEmpty().withMessage('License number is required'),
];

export const prescriptionValidation = [
  body('patientId').notEmpty().withMessage('Patient ID is required'),
  body('medicines').isArray({ min: 1 }).withMessage('At least one medicine is required'),
  body('medicines.*.medicineName').trim().notEmpty().withMessage('Medicine name is required'),
  body('medicines.*.dosage').trim().notEmpty().withMessage('Dosage is required'),
  body('medicines.*.duration').trim().notEmpty().withMessage('Duration is required'),
  body('medicines.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('prescriptionFee').optional().isFloat({ min: 0 }).withMessage('Prescription fee must be a non-negative number'),
  body('caseDiagnosis').optional().trim(),
];

export const orderValidation = [
  body('prescriptionId').notEmpty().withMessage('Prescription ID is required'),
  body('pharmacyId').notEmpty().withMessage('Pharmacy ID is required'),
  body('deliveryAddress').trim().notEmpty().withMessage('Delivery address is required'),
];

export const adminDentistValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('qualification').trim().notEmpty().withMessage('Qualification is required'),
  body('specialization').trim().notEmpty().withMessage('Specialization is required'),
  body('experience').isInt({ min: 0 }).withMessage('Experience must be a positive number'),
  body('contact').notEmpty().withMessage('Contact number is required'),
  body('professionalLicenseNumber').trim().notEmpty().withMessage('Professional license number is required'),
];

export const dentistRegisterValidation = [
  body('name').trim().notEmpty().withMessage('Full name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').optional().isMobilePhone('any').withMessage('Valid phone number required'),
  body('professionalLicenseNumber').trim().notEmpty().withMessage('Professional license number is required'),
];

export const pharmacyUserRegisterValidation = [
  body('name').trim().notEmpty().withMessage('Owner name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').optional().isMobilePhone('any').withMessage('Valid phone number required'),
  body('pharmacyName').trim().notEmpty().withMessage('Pharmacy name is required'),
  body('pharmacyLicenseNumber').trim().notEmpty().withMessage('Pharmacy license number is required'),
  body('address').trim().notEmpty().withMessage('Address is required'),
];

export default {
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  chatValidation,
  educationValidation,
  appointmentValidation,
  dentistValidation,
  pharmacyRegisterValidation,
  dentistRegisterValidation,
  pharmacyUserRegisterValidation,
  prescriptionValidation,
  orderValidation,
  adminDentistValidation,
};
