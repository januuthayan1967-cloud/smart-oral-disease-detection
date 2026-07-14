import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Pharmacy from '../models/Pharmacy.js';
import { AppError } from '../utils/AppError.js';
import { jwtConfig } from '../config/jwt.js';

export const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization?.startsWith('Bearer')) {
      [, token] = req.headers.authorization.split(' ');
    }

    if (!token) {
      return next(new AppError('Not authorized. Please log in.', 401));
    }

    const decoded = jwt.verify(token, jwtConfig.accessSecret);

    if (decoded.role === 'pharmacy') {
      const pharmacy = await Pharmacy.findById(decoded.id);
      if (!pharmacy) {
        return next(new AppError('Pharmacy account no longer exists.', 401));
      }
      if (pharmacy.status !== 'approved') {
        return next(new AppError('Pharmacy account is not approved.', 403));
      }
      req.pharmacy = pharmacy;
      req.user = {
        _id: pharmacy._id,
        id: pharmacy._id,
        role: 'pharmacy',
        email: pharmacy.email,
        name: pharmacy.pharmacyName,
      };
      return next();
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return next(new AppError('User no longer exists.', 401));
    }

    req.user = user;
    return next();
  } catch (error) {
    return next(new AppError('Invalid or expired token. Please log in again.', 401));
  }
};

export const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(new AppError('You do not have permission to perform this action.', 403));
  }
  return next();
};

export default { protect, authorize };
