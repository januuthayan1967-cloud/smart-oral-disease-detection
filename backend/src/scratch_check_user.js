import mongoose from 'mongoose';
import User from './models/User.js';

const uri = 'mongodb+srv://januuthayan1967_db_user:Jpf0kHW3yjxcpF3M@smart-oral-disease-dete.ni8f5j6.mongodb.net/oral_disease_detection?retryWrites=true&w=majority';

console.log('Connecting to MongoDB...');
mongoose.connect(uri)
  .then(async () => {
    console.log('Connected! Checking for test user...');
    const user = await User.findOne({ email: 'test-success-agent-123@gmail.com' });
    if (user) {
      console.log('SUCCESS: User found in database!', JSON.stringify(user, null, 2));
    } else {
      console.log('FAILURE: User not found in database.');
    }
    process.exit(0);
  })
  .catch((err) => {
    console.error('Connection failed:', err);
    process.exit(1);
  });
