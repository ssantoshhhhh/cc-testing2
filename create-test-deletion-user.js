const axios = require('axios');

const BASE_URL = 'http://localhost:8001/api';

async function createTestUser() {
  try {
    console.log('🧪 Creating test user for account deletion...\n');

    // Test user data
    const testUser = {
      name: 'Test Deletion User',
      email: 'testdeletion@example.com',
      password: 'password123',
      studentId: 'DEL001',
      phone: '1234567890',
      department: 'Computer Science'
    };

    console.log('1️⃣ Sending registration OTP...');
    const otpResponse = await axios.post(`${BASE_URL}/auth/send-registration-otp`, testUser);
    console.log('✅ Registration OTP sent successfully:', otpResponse.data);

    console.log('\n2️⃣ To complete user creation:');
    console.log('   - Check the database for the temporary user');
    console.log('   - Verify the OTP was sent to the email');
    console.log('   - Use the OTP to verify registration');
    console.log('   - Then run the account deletion test');

    console.log('\n📝 Test user details:');
    console.log('   Email:', testUser.email);
    console.log('   Password:', testUser.password);
    console.log('   Student ID:', testUser.studentId);

  } catch (error) {
    console.error('❌ Failed to create test user:', error.response?.data || error.message);
  }
}

createTestUser().catch(console.error); 