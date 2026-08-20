import User from '../models/User.js';
import Pharmacy from '../models/Pharmacy.js';
import { AppError } from '../utils/AppError.js';
import { generateToken, hashToken } from '../utils/tokenUtils.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../utils/jwtUtils.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../services/emailService.js';

const sendAuthResponse = (account, res, statusCode = 200, isPharmacy = false) => {
  const role = isPharmacy ? 'pharmacy' : account.role;
  const accessToken = generateAccessToken({ id: account._id, role });
  const refreshToken = generateRefreshToken({ id: account._id, role });

  account.refreshToken = refreshToken;
  account.save({ validateBeforeSave: false });

  const publicData = isPharmacy ? account.toPublicJSON() : account.toPublicJSON();

  res.status(statusCode).json({
    success: true,
    data: {
      user: publicData,
      accessToken,
      refreshToken,
    },
  });
};

export const registerUser = async (req, res) => {
  const { name, email, password, phone, age, gender } = req.body;
  const normalizedEmail = email ? email.trim().toLowerCase() : '';

  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw new AppError('Email already registered.', 400);
  }

  const existingPharmacy = await Pharmacy.findOne({ email: normalizedEmail });
  if (existingPharmacy) {
    throw new AppError('Email already registered.', 400);
  }

  const verificationToken = generateToken();
  const user = await User.create({
    name,
    email: normalizedEmail,
    password,
    phone,
    age,
    gender,
    role: 'user',
    emailVerificationToken: hashToken(verificationToken),
    emailVerificationExpires: Date.now() + 24 * 60 * 60 * 1000,
  });

  await sendVerificationEmail(user, verificationToken);
  sendAuthResponse(user, res, 201);
};

export const registerPharmacy = async (req, res) => {
  const {
    pharmacyName,
    ownerName,
    email,
    password,
    phone,
    address,
    district,
    city,
    latitude,
    longitude,
    licenseNumber,
  } = req.body;
  const normalizedEmail = email ? email.trim().toLowerCase() : '';

  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw new AppError('Email already registered.', 400);
  }

  const existingPharmacy = await Pharmacy.findOne({ email: normalizedEmail });
  if (existingPharmacy) {
    throw new AppError('Email already registered.', 400);
  }

  const documents = {
    pharmacyLicense: req.files?.pharmacyLicense?.[0]
      ? `/uploads/pharmacy/${req.files.pharmacyLicense[0].filename}`
      : '',
    businessRegistration: req.files?.businessRegistration?.[0]
      ? `/uploads/pharmacy/${req.files.businessRegistration[0].filename}`
      : '',
    pharmacistQualification: req.files?.pharmacistQualification?.[0]
      ? `/uploads/pharmacy/${req.files.pharmacistQualification[0].filename}`
      : '',
  };

  if (!documents.pharmacyLicense || !documents.businessRegistration || !documents.pharmacistQualification) {
    throw new AppError('All three documents are required: pharmacy license, business registration, and pharmacist qualification.', 400);
  }

  const pharmacy = await Pharmacy.create({
    pharmacyName,
    ownerName,
    email: normalizedEmail,
    password,
    phone,
    address,
    district,
    city,
    licenseNumber,
    location: {
      type: 'Point',
      coordinates: [parseFloat(longitude), parseFloat(latitude)],
    },
    documents,
    status: 'pending',
  });

  res.status(201).json({
    success: true,
    message: 'Pharmacy registration submitted. Please wait for admin approval before logging in.',
    data: pharmacy.toPublicJSON(),
  });
};

export const register = registerUser;

export const registerDentist = async (req, res) => {
  const { name, email, password, phone, professionalLicenseNumber } = req.body;
  const normalizedEmail = email ? email.trim().toLowerCase() : '';

  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw new AppError('Email already registered.', 400);
  }

  const existingPharmacy = await Pharmacy.findOne({ email: normalizedEmail });
  if (existingPharmacy) {
    throw new AppError('Email already registered.', 400);
  }

  const verificationToken = generateToken();
  const dentist = await User.create({
    name,
    email: normalizedEmail,
    password,
    phone,
    role: 'dentist',
    approvalStatus: 'pending',
    professionalLicenseNumber,
    emailVerificationToken: hashToken(verificationToken),
    emailVerificationExpires: Date.now() + 24 * 60 * 60 * 1000,
  });

  res.status(201).json({
    success: true,
    message: 'Dentist registration submitted. Please wait for admin approval before logging in.',
    data: dentist.toPublicJSON(),
  });
};

export const registerPharmacyUser = async (req, res) => {
  const { name, email, password, phone, pharmacyName, pharmacyLicenseNumber, address } = req.body;
  const normalizedEmail = email ? email.trim().toLowerCase() : '';

  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw new AppError('Email already registered.', 400);
  }

  const existingPharmacy = await Pharmacy.findOne({ email: normalizedEmail });
  if (existingPharmacy) {
    throw new AppError('Email already registered.', 400);
  }

  const pharmacyAccount = await User.create({
    name,
    email: normalizedEmail,
    password,
    phone,
    role: 'pharmacy',
    approvalStatus: 'pending',
    pharmacyName,
    pharmacyLicenseNumber,
    address,
  });

  res.status(201).json({
    success: true,
    message: 'Pharmacy registration submitted. Please wait for admin approval before logging in.',
    data: pharmacyAccount.toPublicJSON(),
  });
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = email ? email.trim().toLowerCase() : '';

  const pharmacy = await Pharmacy.findOne({ email: normalizedEmail }).select('+password +refreshToken');
  if (pharmacy) {
    if (!(await pharmacy.comparePassword(password))) {
      throw new AppError('Invalid email or password.', 401);
    }

    if (pharmacy.status === 'pending') {
      throw new AppError('Your pharmacy application is pending admin approval.', 403);
    }

    if (pharmacy.status === 'rejected') {
      throw new AppError(`Your pharmacy application was rejected. Reason: ${pharmacy.rejectionReason || 'Not specified'}`, 403);
    }

    return sendAuthResponse(pharmacy, res, 200, true);
  }

  const user = await User.findOne({ email: normalizedEmail }).select('+password +refreshToken');
  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Invalid email or password.', 401);
  }

  // Approval check for dentist and pharmacy roles registered via User model
  if (user.role === 'dentist' || user.role === 'pharmacy') {
    if (user.approvalStatus === 'pending') {
      throw new AppError('Your account is awaiting admin approval.', 403);
    }
    if (user.approvalStatus === 'rejected') {
      throw new AppError('Your registration has been rejected. Please contact administration.', 403);
    }
  }

  sendAuthResponse(user, res);
};

export const refreshToken = async (req, res) => {
  const { refreshToken: token } = req.body;

  if (!token) {
    throw new AppError('Refresh token is required.', 400);
  }

  const decoded = verifyRefreshToken(token);

  if (decoded.role === 'pharmacy') {
    const pharmacy = await Pharmacy.findById(decoded.id).select('+refreshToken');
    if (!pharmacy || pharmacy.refreshToken !== token) {
      throw new AppError('Invalid refresh token.', 401);
    }
    return sendAuthResponse(pharmacy, res, 200, true);
  }

  const user = await User.findById(decoded.id).select('+refreshToken');
  if (!user || user.refreshToken !== token) {
    throw new AppError('Invalid refresh token.', 401);
  }

  sendAuthResponse(user, res);
};

export const logout = async (req, res) => {
  if (req.user.role === 'pharmacy') {
    const pharmacy = await Pharmacy.findById(req.user._id);
    if (pharmacy) {
      pharmacy.refreshToken = undefined;
      await pharmacy.save({ validateBeforeSave: false });
    }
  } else {
    req.user.refreshToken = undefined;
    await req.user.save({ validateBeforeSave: false });
  }

  res.json({ success: true, message: 'Logged out successfully.' });
};

export const getProfile = async (req, res) => {
  if (req.user.role === 'pharmacy') {
    const pharmacy = await Pharmacy.findById(req.user._id);
    return res.json({ success: true, data: pharmacy.toPublicJSON() });
  }
  res.json({ success: true, data: req.user.toPublicJSON() });
};

export const updateProfile = async (req, res) => {
  const allowedFields = ['name', 'phone', 'age', 'gender'];
  const updates = {};

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  if (req.file) {
    updates.profileImage = `/uploads/${req.file.filename}`;
  }

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  });

  res.json({ success: true, data: user.toPublicJSON() });
};

export const forgotPassword = async (req, res) => {
  const normalizedEmail = req.body.email ? req.body.email.trim().toLowerCase() : '';
  let account = await User.findOne({ email: normalizedEmail });
  let accountType = 'user';

  if (!account) {
    account = await Pharmacy.findOne({ email: normalizedEmail });
    accountType = 'pharmacy';
  }

  if (!account) {
    throw new AppError('No account found with this email address.', 404);
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedOtp = hashToken(otp);

  account.resetPasswordOtp = hashedOtp;
  account.resetPasswordOtpExpires = Date.now() + 10 * 60 * 1000;
  await account.save({ validateBeforeSave: false });

  const emailResult = await sendPasswordResetEmail(account, otp);

  if (emailResult?.error) {
    throw new AppError(`Failed to send OTP email: ${emailResult.message || 'SMTP service error'}`, 500);
  }

  res.json({
    success: true,
    message: emailResult?.mocked
      ? 'An OTP verification code was generated (mock email mode enabled).'
      : 'An OTP verification code has been sent to your email.',
  });
};

export const verifyOtp = async (req, res) => {
  const normalizedEmail = req.body.email ? req.body.email.trim().toLowerCase() : '';
  const { otp } = req.body;

  if (!otp || otp.length !== 6) {
    throw new AppError('A valid 6-digit OTP is required.', 400);
  }

  const hashedOtp = hashToken(otp);

  let account = await User.findOne({
    email: normalizedEmail,
    resetPasswordOtp: hashedOtp,
    resetPasswordOtpExpires: { $gt: Date.now() },
  });

  if (!account) {
    account = await Pharmacy.findOne({
      email: normalizedEmail,
      resetPasswordOtp: hashedOtp,
      resetPasswordOtpExpires: { $gt: Date.now() },
    });
  }

  if (!account) {
    throw new AppError('Invalid or expired OTP code.', 400);
  }

  res.json({
    success: true,
    message: 'OTP verified successfully.',
  });
};

export const resetPassword = async (req, res) => {
  const normalizedEmail = req.body.email ? req.body.email.trim().toLowerCase() : '';
  const { otp, password, token } = req.body;

  let account;
  let isPharmacy = false;

  if (otp) {
    const hashedOtp = hashToken(otp);
    account = await User.findOne({
      email: normalizedEmail,
      resetPasswordOtp: hashedOtp,
      resetPasswordOtpExpires: { $gt: Date.now() },
    });

    if (!account) {
      account = await Pharmacy.findOne({
        email: normalizedEmail,
        resetPasswordOtp: hashedOtp,
        resetPasswordOtpExpires: { $gt: Date.now() },
      });
      if (account) isPharmacy = true;
    }
  } else if (token) {
    const hashedToken = hashToken(token);
    account = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!account) {
      account = await Pharmacy.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { $gt: Date.now() },
      });
      if (account) isPharmacy = true;
    }
  }

  if (!account) {
    throw new AppError('Invalid or expired reset credentials.', 400);
  }

  account.password = password;
  account.resetPasswordOtp = undefined;
  account.resetPasswordOtpExpires = undefined;
  account.resetPasswordToken = undefined;
  account.resetPasswordExpires = undefined;
  await account.save();

  sendAuthResponse(account, res, 200, isPharmacy);
};

export const verifyEmail = async (req, res) => {
  const hashedToken = hashToken(req.query.token);
  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpires: { $gt: Date.now() },
  });

  if (!user) {
    throw new AppError('Invalid or expired verification token.', 400);
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save({ validateBeforeSave: false });

  res.json({ success: true, message: 'Email verified successfully.' });
};

export default {
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
};
