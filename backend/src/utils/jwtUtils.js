import jwt from 'jsonwebtoken';
import { jwtConfig } from '../config/jwt.js';

export const generateAccessToken = (payload) =>
  jwt.sign(payload, jwtConfig.accessSecret, {
    expiresIn: jwtConfig.accessExpiresIn,
  });

export const generateRefreshToken = (payload) =>
  jwt.sign(payload, jwtConfig.refreshSecret, {
    expiresIn: jwtConfig.refreshExpiresIn,
  });

export const verifyAccessToken = (token) =>
  jwt.verify(token, jwtConfig.accessSecret);

export const verifyRefreshToken = (token) =>
  jwt.verify(token, jwtConfig.refreshSecret);

export default {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
