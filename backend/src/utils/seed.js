import '../config/env.js';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import Education from '../models/Education.js';
import Dentist from '../models/Dentist.js';
import Pharmacy from '../models/Pharmacy.js';

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

  const dentistUserExists = await User.findOne({ email: 'dentist@oralhealth.ai' });
  if (!dentistUserExists) {
    await User.create({
      name: 'Dr. Sarah Mitchell',
      email: 'dentist@oralhealth.ai',
      password: 'Dentist@123',
      role: 'dentist',
      approvalStatus: 'approved',
      isEmailVerified: true,
      phone: '+1234567890',
      professionalLicenseNumber: 'DENT-2024-001',
    });
    console.log('Dentist user created: dentist@oralhealth.ai / Dentist@123');
  }

  const contentCount = await Education.countDocuments();
    await Education.deleteMany({}); // refresh education seed with verified resources
    await Education.insertMany([
      {
        title: 'WHO Global Oral Health Report',
        category: 'articles',
        description: 'Comprehensive WHO fact sheet detailing the global burden of oral diseases affecting 3.7 billion people, main risk factors like free sugars and tobacco, and key strategies for prevention.',
        source: 'World Health Organization (WHO)',
        sourceUrl: 'https://www.who.int/news-room/fact-sheets/detail/oral-health',
        readTime: '4 min read',
      },
      {
        title: 'Sugars & Dental Caries Prevention',
        category: 'prevention',
        description: 'Official WHO guideline highlighting the direct causal relationship between free sugar intake and dental caries, including dietary recommendations to prevent tooth decay.',
        source: 'World Health Organization (WHO)',
        sourceUrl: 'https://www.who.int/news-room/fact-sheets/detail/sugars-and-dental-caries',
        readTime: '3 min read',
      },
      {
        title: 'NIH Guide: Tooth Decay & Cavity Formation',
        category: 'articles',
        description: 'Clinical publication from NIDCR/NIH explaining how bacterial plaque produces enamel-destroying acids and how fluoride and proper hygiene prevent tooth decay.',
        source: 'National Institute of Dental and Craniofacial Research (NIH)',
        sourceUrl: 'https://www.nidcr.nih.gov/health-info/tooth-decay',
        readTime: '4 min read',
      },
      {
        title: 'NIH Guide: Periodontal & Gum Disease',
        category: 'prevention',
        description: 'Evidence-based overview of gum disease progression from mild gingivitis to chronic periodontitis, detailing risk factors, systemic health connections, and prevention.',
        source: 'National Institute of Dental and Craniofacial Research (NIH)',
        sourceUrl: 'https://www.nidcr.nih.gov/health-info/gum-disease',
        readTime: '5 min read',
      },
      {
        title: 'NHS: How to Keep Your Teeth Clean',
        category: 'brushing',
        description: 'Official NHS hygiene guide on effective toothbrushing twice daily, recommended fluoride toothpaste concentrations (ppm), flossing habits, and mouthwash advice.',
        source: 'NHS (UK National Health Service)',
        sourceUrl: 'https://www.nhs.uk/live-well/healthy-teeth-and-gums/how-to-keep-your-teeth-clean/',
        readTime: '3 min read',
      },
      {
        title: 'CDC: Community Oral Disease Prevention',
        category: 'tips',
        description: 'CDC guidance on evidence-based community oral disease prevention, dental sealants, water fluoridation benefits, and routine daily hygiene practices.',
        source: 'Centers for Disease Control and Prevention (CDC)',
        sourceUrl: 'https://www.cdc.gov/oral-health/prevention/index.html',
        readTime: '3 min read',
      },
      {
        title: 'FDI: Interdental Cleaning & Oral Health Topics',
        category: 'flossing',
        description: 'Global dental federation portal offering clinical advice, interdental cleaning practices, and oral disease policy resources.',
        source: 'FDI World Dental Federation',
        sourceUrl: 'https://www.fdiworlddental.org/resources',
        readTime: '4 min read',
      },
      {
        title: 'WHO Science in 5: Global Oral Health Video',
        category: 'video',
        description: 'Official WHO video episode featuring Dr. Benoit Varenne explaining global oral health challenges, risk factors, and core daily hygiene habits.',
        source: 'World Health Organization (WHO)',
        sourceUrl: 'https://www.who.int/news-room/fact-sheets/detail/oral-health',
        videoUrl: 'https://www.youtube.com/watch?v=-b6NGkv5RmM',
        readTime: '5 min video',
      },
    ]);
    console.log('Verified educational resources seeded.');

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

  const pharmacyCount = await Pharmacy.countDocuments();
  if (pharmacyCount === 0) {
    await Pharmacy.create([
      {
        pharmacyName: 'Central Care Pharmacy',
        ownerName: 'Robert Johnson',
        email: 'central.care@pharmacy.com',
        password: 'Pharmacy@123',
        phone: '+94 11 234 5678',
        address: '100 Main Hospital Road, Colombo 03',
        city: 'Colombo',
        district: 'Colombo',
        licenseNumber: 'PH-2024-001',
        status: 'approved',
        location: {
          type: 'Point',
          coordinates: [79.8612, 6.9271], // Colombo [lng, lat]
        },
        inventory: [
          { medicineName: 'Amoxicillin 500mg', category: 'Antibiotics', price: 15.0, quantity: 100 },
          { medicineName: 'Ibuprofen 400mg', category: 'Pain Relief', price: 8.5, quantity: 150 },
          { medicineName: 'Chlorhexidine 0.2% Mouthwash', category: 'Antiseptic', price: 12.0, quantity: 50 },
        ],
      },
      {
        pharmacyName: 'City Dental & Health Pharmacy',
        ownerName: 'Emily Clark',
        email: 'city.dental@pharmacy.com',
        password: 'Pharmacy@123',
        phone: '+94 11 876 5432',
        address: '45 Health Avenue, Colombo 07',
        city: 'Colombo',
        district: 'Colombo',
        licenseNumber: 'PH-2024-002',
        status: 'approved',
        location: {
          type: 'Point',
          coordinates: [79.8700, 6.9350], // Colombo North [lng, lat]
        },
        inventory: [
          { medicineName: 'Paracetamol 500mg', category: 'Pain Relief', price: 5.0, quantity: 200 },
          { medicineName: 'Metronidazole 400mg', category: 'Antibiotics', price: 18.0, quantity: 80 },
        ],
      },
      {
        pharmacyName: 'Meesalai Medicare Pharmacy',
        ownerName: 'K. Thavanesan',
        email: 'meesalai.pharmacy@example.com',
        password: 'Pharmacy@123',
        phone: '+94 21 228 1234',
        address: 'A9 Road, Meesalai Junction',
        city: 'Chavakachcheri',
        district: 'Jaffna',
        licenseNumber: 'PH-2024-003',
        status: 'approved',
        location: {
          type: 'Point',
          coordinates: [80.1415, 9.6795], // Meesalai [lng, lat]
        },
        inventory: [
          { medicineName: 'Amoxicillin 500mg', category: 'Antibiotics', price: 15.0, quantity: 120 },
          { medicineName: 'Paracetamol 500mg', category: 'Pain Relief', price: 5.0, quantity: 300 },
          { medicineName: 'Ibuprofen 400mg', category: 'Pain Relief', price: 8.0, quantity: 100 },
          { medicineName: 'Chlorhexidine 0.2% Mouthwash', category: 'Antiseptic', price: 12.0, quantity: 60 },
        ],
      },
      {
        pharmacyName: 'Jaffna Central Medicare Pharmacy',
        ownerName: 'S. Rajasingham',
        email: 'jaffna.medicare@example.com',
        password: 'Pharmacy@123',
        phone: '+94 21 222 5678',
        address: 'Hospital Road, Jaffna',
        city: 'Jaffna',
        district: 'Jaffna',
        licenseNumber: 'PH-2024-004',
        status: 'approved',
        location: {
          type: 'Point',
          coordinates: [80.0150, 9.6650], // Jaffna Town (~14 km from Meesalai) [lng, lat]
        },
        inventory: [
          { medicineName: 'Amoxicillin 500mg', category: 'Antibiotics', price: 16.0, quantity: 80 },
          { medicineName: 'Metronidazole 400mg', category: 'Antibiotics', price: 18.0, quantity: 90 },
          { medicineName: 'Paracetamol 500mg', category: 'Pain Relief', price: 5.0, quantity: 250 },
        ],
      },
      {
        pharmacyName: 'Kandy Royal Care Pharmacy',
        ownerName: 'Nimal Perera',
        email: 'kandy.royal@example.com',
        password: 'Pharmacy@123',
        phone: '+94 81 223 4567',
        address: 'Peradeniya Road, Kandy',
        city: 'Kandy',
        district: 'Kandy',
        licenseNumber: 'PH-2024-005',
        status: 'approved',
        location: {
          type: 'Point',
          coordinates: [80.6337, 7.2906], // Kandy [lng, lat]
        },
        inventory: [
          { medicineName: 'Amoxicillin 500mg', category: 'Antibiotics', price: 15.0, quantity: 110 },
          { medicineName: 'Ibuprofen 400mg', category: 'Pain Relief', price: 8.5, quantity: 140 },
        ],
      },
    ]);
    console.log('Sample approved pharmacies seeded across Colombo, Jaffna/Meesalai, and Kandy.');
  }

  console.log('Seeding completed.');
  process.exit(0);
};

seedData().catch((err) => {
  console.error(err);
  process.exit(1);
});
