import mongoose from 'mongoose';

const uri = 'mongodb+srv://januuthayan1967_db_user:Jpf0kHW3yjxcpF3M@smart-oral-disease-dete.ni8f5j6.mongodb.net/oral_disease_detection?retryWrites=true&w=majority';

console.log('Testing connection to MongoDB...');
mongoose.connect(uri)
  .then(() => {
    console.log('SUCCESS: Connected to MongoDB successfully!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('FAILURE: Could not connect to MongoDB.');
    console.error('Error name:', err.name);
    console.error('Error message:', err.message);
    process.exit(1);
  });
