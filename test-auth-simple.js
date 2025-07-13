const axios = require('axios');

const BASE_URL = 'http://localhost:8001/api';

async function testAuth() {
  try {
    console.log('🧪 Testing Authentication...\n');

    // Test login
    console.log('1️⃣ Testing login...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@campusconnect.com',
      password: 'admin123'
    }, {
      withCredentials: true
    });
    
    console.log('✅ Login successful');
    console.log('User ID:', loginResponse.data.user.id);
    console.log('Has Profile Picture:', loginResponse.data.user.hasProfilePicture);

    // Test getting current user
    console.log('\n2️⃣ Testing get current user...');
    const meResponse = await axios.get(`${BASE_URL}/auth/me`, {
      withCredentials: true
    });
    
    console.log('✅ Get current user successful');
    console.log('User ID:', meResponse.data.user.id);
    console.log('Has Profile Picture:', meResponse.data.user.hasProfilePicture);

    console.log('\n🎉 Authentication test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testAuth(); 