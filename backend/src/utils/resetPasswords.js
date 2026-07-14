/**
 * Password Reset Script
 * Resets passwords for all existing User, Dentist, and Pharmacy accounts
 * whose passwords were corrupted by a prior double-hashing bug.
 *
 * Run with:  node src/utils/resetPasswords.js
 */
import '../config/env.js';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import Pharmacy from '../models/Pharmacy.js';
import bcrypt from 'bcryptjs';


await connectDB();

console.log('=== PASSWORD RESET SCRIPT ===\n');

// Default reset password for all accounts
const DEFAULT_PASSWORD = 'Reset@12345';
const newHash = await bcrypt.hash(DEFAULT_PASSWORD, 12);

// Reset all non-admin User accounts (user, dentist, pharmacy roles in User model)
const users = await User.find({ role: { $ne: 'admin' } }).select('+password');
console.log(`Found ${users.length} non-admin user(s) to reset.`);

for (const u of users) {
  // Directly update the hash without triggering pre-save hook (to avoid double-hash)
  await User.updateOne({ _id: u._id }, { $set: { password: newHash } });
  console.log(`  ✅ Reset [${u.role}] ${u.email}`);
}

// Reset all Pharmacy accounts
const pharmacies = await Pharmacy.find({}).select('+password');
console.log(`\nFound ${pharmacies.length} pharmacy account(s) to reset.`);

for (const p of pharmacies) {
  await Pharmacy.updateOne({ _id: p._id }, { $set: { password: newHash } });
  console.log(`  ✅ Reset [pharmacy] ${p.email}`);
}

console.log(`\n✅ All done. New password for all reset accounts: ${DEFAULT_PASSWORD}`);
console.log('\nAccounts affected:');
for (const u of users) {
  console.log(`  [${u.role}] ${u.email}  →  password: ${DEFAULT_PASSWORD}`);
}
for (const p of pharmacies) {
  console.log(`  [pharmacy] ${p.email}  →  password: ${DEFAULT_PASSWORD}`);
}

process.exit(0);
