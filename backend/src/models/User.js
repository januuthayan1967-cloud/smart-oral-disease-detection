import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ['user', 'dentist', 'pharmacy', 'admin'],
      default: 'user',
    },
    approvalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'approved',
    },
    professionalLicenseNumber: {
      type: String,
      trim: true,
    },
    pharmacyName: {
      type: String,
      trim: true,
    },
    pharmacyLicenseNumber: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    age: {
      type: Number,
      min: 1,
      max: 120,
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer_not_to_say'],
    },
    profileImage: {
      type: String,
      default: '',
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    refreshToken: {
      type: String,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role || 'user',
    approvalStatus: this.approvalStatus,
    phone: this.phone,
    age: this.age,
    gender: this.gender,
    profileImage: this.profileImage,
    isEmailVerified: this.isEmailVerified,
    professionalLicenseNumber: this.professionalLicenseNumber,
    pharmacyName: this.pharmacyName,
    pharmacyLicenseNumber: this.pharmacyLicenseNumber,
    address: this.address,
    createdAt: this.createdAt,
  };
};

const User = mongoose.model('User', userSchema);

export default User;
