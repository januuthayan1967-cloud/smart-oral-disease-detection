import axios from 'axios';

const credentials = {
  email: 'test-api-1784131591899@gmail.com',
  password: 'Password@123'
};

console.log('Sending login request to Vercel...');
axios.post('https://smart-oral-disease-detection.vercel.app/api/auth/login', credentials)
  .then((res) => {
    console.log('SUCCESS: Logged in successfully!');
    console.log('Response Status:', res.status);
    console.log('Response Data:', JSON.stringify(res.data, null, 2));
  })
  .catch((err) => {
    console.error('FAILURE: Login failed.');
    if (err.response) {
      console.error('Response Status:', err.response.status);
      console.error('Response Data:', JSON.stringify(err.response.data, null, 2));
    } else {
      console.error('Error message:', err.message);
    }
  });
