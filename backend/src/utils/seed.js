import '../config/env.js';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import Education from '../models/Education.js';
import Dentist from '../models/Dentist.js';

const seedData = async () => {
  await connectDB();

  const adminExists = await User.findOne({ email: 'admin@oralhealth.ai' });
  if (!adminExists) {
    await User.create({
      name: 'System Admin',
      email: 'admin@oralhealth.ai',
      password: 'Admin@123',
      role: 'admin',
      isEmailVerified: true,
    });
    console.log('Admin user created: admin@oralhealth.ai / Admin@123');
  }

  const contentCount = await Education.countDocuments();
  if (contentCount === 0) {
    await Education.insertMany([
      {
        title: 'Proper Brushing Technique',
        category: 'brushing',
        description: 'Brush at a 45-degree angle to the gum line using gentle circular motions for 2 minutes.',
      },
      {
        title: 'How to Floss Correctly',
        category: 'flossing',
        description: 'Use 18 inches of floss, wrap around fingers, and curve around each tooth in a C-shape.',
      },
      {
        title: 'Benefits of Mouthwash',
        category: 'mouthwash',
        description: 'Mouthwash helps reduce bacteria, freshen breath, and reach areas brushing may miss.',
      },
      {
        title: 'Preventing Dental Caries',
        category: 'prevention',
        description: 'Limit sugar intake, use fluoride toothpaste, and visit your dentist regularly.',
      },
    ]);
    console.log('Sample educational content seeded.');
  }

  const dentistCount = await Dentist.countDocuments();
  if (dentistCount === 0) {
    await Dentist.insertMany([
      {
        name: 'Dr. Sarah Mitchell',
        qualification: 'BDS, MDS',
        specialization: 'General Dentistry',
        experience: 10,
        phone: '+1234567890',
        email: 'sarah.mitchell@dental.com',
        availability: [
          { day: 'Monday', slots: ['09:00', '10:00', '11:00', '14:00'] },
          { day: 'Wednesday', slots: ['09:00', '10:00', '15:00'] },
        ],
      },
      {
        name: 'Dr. James Carter',
        qualification: 'BDS',
        specialization: 'Orthodontics',
        experience: 7,
        phone: '+1234567891',
        email: 'james.carter@dental.com',
        availability: [
          { day: 'Tuesday', slots: ['10:00', '11:00', '16:00'] },
          { day: 'Friday', slots: ['09:00', '13:00', '14:00'] },
        ],
      },
    ]);
    console.log('Sample dentists seeded.');
  }

  console.log('Seeding completed.');
  process.exit(0);
};

seedData().catch((err) => {
  console.error(err);
  process.exit(1);
});
