import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import Pharmacy from '../models/Pharmacy.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function restorePharmacyCoordinates() {
  const backupFilePath = path.join(__dirname, 'pharmacy_coordinates_backup.json');

  if (!fs.existsSync(backupFilePath)) {
    console.error(`Backup file not found at: ${backupFilePath}`);
    process.exit(1);
  }

  const backupData = JSON.parse(fs.readFileSync(backupFilePath, 'utf8'));
  console.log(`Loaded backup created at: ${backupData.timestamp}`);

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB.\n');

  let restoredCount = 0;

  for (const item of backupData.pharmacies) {
    const pharmacy = await Pharmacy.findById(item._id);
    if (pharmacy && item.location) {
      pharmacy.location = item.location;
      await pharmacy.save();
      console.log(`✓ Restored coordinates for: ${pharmacy.pharmacyName} -> [${item.location.coordinates.join(', ')}]`);
      restoredCount++;
    }
  }

  console.log(`\nSuccessfully restored coordinates for ${restoredCount} pharmacies.`);
  await mongoose.disconnect();
}

restorePharmacyCoordinates().catch((err) => {
  console.error('Restore failed:', err);
  process.exit(1);
});
