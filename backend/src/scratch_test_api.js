import axios from 'axios';

const testUser = {
  name: 'Test Api User',
  email: `test-api-${Date.now()}@gmail.com`,
  password: 'Password@123',
  phone: '1234567890',
  age: 25,
  gender: 'male'
};

console.log('Sending registration request to Vercel...');
axios.post('https://smart-oral-disease-detection.vercel.app/api/auth/register-user', testUser)
  .then((res) => {
    console.log('SUCCESS: Registered successfully!');
    console.log('Response Status:', res.status);
    console.log('Response Data:', JSON.stringify(res.data, null, 2));
  })
  .catch((err) => {
    console.error('FAILURE: Registration failed.');
    if (err.response) {
      console.error('Response Status:', err.response.status);
      console.error('Response Data:', JSON.stringify(err.response.data, null, 2));
    } else {
      console.error('Error message:', err.message);
    }
  });
