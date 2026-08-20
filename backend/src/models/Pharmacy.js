import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const inventoryItemSchema = new mongoose.Schema(
  {
    medicineName: { type: String, required: true, trim: true },
    category: { type: String, default: 'General', trim: true },
    description: { type: String, default: '', trim: true },
    image: { type: String, default: '' },
    quantity: { type: Number, required: true, min: 0 },
    price: { type: Number, required: true, min: 0 },
    expiryDate: { type: Date, default: null },
  },
  { _id: true }
);

const pharmacySchema = new mongoose.Schema(
  {
    pharmacyName: {
      type: String,
      required: [true, 'Pharmacy name is required'],
      trim: true,
    },
    ownerName: {
      type: String,
      required: [true, 'Owner name is required'],
      trim: true,
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
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    district: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
    licenseNumber: {
      type: String,
      required: true,
      trim: true,
    },
    documents: {
      pharmacyLicense: { type: String, default: '' },
      businessRegistration: { type: String, default: '' },
      pharmacistQualification: { type: String, default: '' },
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    rejectionReason: {
      type: String,
      default: '',
    },
    inventory: [inventoryItemSchema],
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    resetPasswordOtp: String,
    resetPasswordOtpExpires: Date,
    refreshToken: {
      type: String,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

pharmacySchema.index({ location: '2dsphere' });

pharmacySchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

pharmacySchema.methods.comparePassword = async function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

pharmacySchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: this._id,
    pharmacyName: this.pharmacyName,
    ownerName: this.ownerName,
    email: this.email,
    phone: this.phone,
    address: this.address,
    city: this.city,
    district: this.district,
    location: this.location,
    licenseNumber: this.licenseNumber,
    documents: this.documents,
    status: this.status,
    rejectionReason: this.rejectionReason,
    inventory: this.inventory,
    role: 'pharmacy',
    createdAt: this.createdAt,
  };
};

const Pharmacy = mongoose.model('Pharmacy', pharmacySchema);

export default Pharmacy;
