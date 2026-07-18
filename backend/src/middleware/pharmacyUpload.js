import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { AppError } from '../utils/AppError.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isVercel = process.env.VERCEL === '1';
const uploadDir = isVercel ? '/tmp/uploads/pharmacy' : path.join(__dirname, '../uploads/pharmacy');

try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
} catch (err) {
  console.warn(`Could not create pharmacy uploads directory: ${err.message}`);
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `pharmacy-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const allowedExt = /jpeg|jpg|png|webp|pdf/;
  const ext = allowedExt.test(path.extname(file.originalname).toLowerCase());
  const allowedMime = /image\/(jpeg|jpg|png|webp)|application\/pdf/;
  const mime = allowedMime.test(file.mimetype);

  if (ext && mime) {
    cb(null, true);
  } else {
    cb(new AppError('Only JPEG, PNG, WebP images and PDF documents are allowed.', 400), false);
  }
};

export const pharmacyUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

export default pharmacyUpload;
