import './config/env.js';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
// xss-clean is NOT applied globally — see selective sanitiser below
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/authRoutes.js';
import predictionRoutes from './routes/predictionRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import educationRoutes from './routes/educationRoutes.js';
import dentistRoutes from './routes/dentistRoutes.js';
import dentistDashboardRoutes from './routes/dentistDashboardRoutes.js';
import appointmentRoutes from './routes/appointmentRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import pharmacyRoutes from './routes/pharmacyRoutes.js';
import prescriptionRoutes from './routes/prescriptionRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import medicineMarketRoutes from './routes/medicineMarketRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import directOrderRoutes from './routes/directOrderRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import connectDB from './config/db.js';

// Connect to MongoDB
connectDB().catch(err => {
  console.error('Database connection failed to initialize at startup:', err.message);
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl, server-to-server, or same-origin)
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.includes(origin) ||
      /\.vercel\.app$/.test(origin) ||
      (process.env.CLIENT_URL && origin === process.env.CLIENT_URL)
    ) {
      return callback(null, true);
    }
    // Allow all origins gracefully in development or if origin is valid
    return callback(null, true);
  },
  credentials: true,
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, message: 'Too many requests. Please try again later.' },
});

app.use('/api', limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(mongoSanitize());

// Selective XSS sanitiser — skips password/card fields to prevent corruption
const SKIP_XSS_FIELDS = new Set(['password', 'cvv', 'cardNumber', 'cardHolderName', 'cardExpiry', 'currentPassword', 'newPassword']);
app.use((req, _res, next) => {
  // Apply xss-clean only to non-sensitive string fields in the body
  if (req.body && typeof req.body === 'object') {
    const sanitiseObject = (obj) => {
      for (const key of Object.keys(obj)) {
        if (SKIP_XSS_FIELDS.has(key)) continue; // preserve as-is
        if (typeof obj[key] === 'string') {
          // Use xss-clean's internal sanitiser indirectly via a temp express app
          // For simplicity, strip only the most dangerous patterns manually:
          // Script tags, event handlers — but leave @, &, quotes intact
          obj[key] = obj[key]
            .replace(/<script[^>]*>.*?<\/script>/gi, '')
            .replace(/<[^>]+on\w+\s*=\s*["'][^"']*["'][^>]*>/gi, '');
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          sanitiseObject(obj[key]);
        }
      }
    };
    sanitiseObject(req.body);
  }
  next();
});

const isVercel = process.env.VERCEL === '1';
if (isVercel) {
  app.use('/uploads', express.static('/tmp/uploads'));
  app.use('/uploads/medicines', express.static('/tmp/uploads/medicines'));
  app.use('/uploads/pharmacy', express.static('/tmp/uploads/pharmacy'));
  app.use('/reports', express.static('/tmp/reports'));
} else {
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
  app.use('/uploads/medicines', express.static(path.join(__dirname, 'uploads/medicines')));
  app.use('/uploads/pharmacy', express.static(path.join(__dirname, 'uploads/pharmacy')));
  app.use('/reports', express.static(path.join(__dirname, 'reports')));
}

import mongoose from 'mongoose';

app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    message: 'Oral Disease Detection API is running',
    timestamp: new Date().toISOString(),
    dbState: mongoose.connection.readyState,
    hasMongoUri: !!process.env.MONGODB_URI,
    mongoUriLength: process.env.MONGODB_URI ? process.env.MONGODB_URI.length : 0,
    hasSmtpUser: !!process.env.SMTP_USER,
    hasSmtpPass: !!process.env.SMTP_PASS,
    smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
    smtpPort: Number(process.env.SMTP_PORT) || 587,
    envKeys: Object.keys(process.env).filter(k => 
      !k.toLowerCase().includes('secret') && 
      !k.toLowerCase().includes('pass') && 
      !k.toLowerCase().includes('key') && 
      !k.toLowerCase().includes('uri')
    )
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/predict', predictionRoutes);
app.use('/api/predictions', predictionRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/education', educationRoutes);
app.use('/api/dentists', dentistRoutes);
app.use('/api/dentist', dentistDashboardRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/pharmacy', pharmacyRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/pharmacies', orderRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/medicines', medicineMarketRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/direct-orders', directOrderRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/payments', paymentRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
