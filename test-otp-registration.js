const axios = require('axios');

const BASE_URL = 'http://localhost:8001/api';

async function testOTPRegistration() {
  try {
    console.log('🧪 Testing OTP Registration Flow...\n');

    // Test data
    const testUser = {
      name: 'Test User OTP',
      email: 'testotp@example.com',
      password: 'password123',
      studentId: 'OTP001',
      phone: '1234567890',
      department: 'Computer Science'
    };

    console.log('1️⃣ Sending registration OTP...');
    const otpResponse = await axios.post(`${BASE_URL}/auth/send-registration-otp`, testUser);
    console.log('✅ OTP sent successfully:', otpResponse.data);

    // Note: In a real test, you would need to check the email or database for the OTP
    console.log('\n2️⃣ To complete the test:');
    console.log('   - Check the database for the temporary user');
    console.log('   - Verify the OTP was sent to the email');
    console.log('   - Use the OTP to verify registration');

    console.log('\n3️⃣ Testing resend OTP...');
    const resendResponse = await axios.post(`${BASE_URL}/auth/resend-registration-otp`, {
      email: testUser.email
    });
    console.log('✅ Resend OTP successful:', resendResponse.data);

    console.log('\n4️⃣ Testing invalid OTP verification...');
    try {
      await axios.post(`${BASE_URL}/auth/verify-registration-otp`, {
        email: testUser.email,
        otp: '000000'
      });
    } catch (error) {
      console.log('✅ Invalid OTP correctly rejected:', error.response.data.message);
    }

    console.log('\n🎉 OTP Registration flow test completed!');
    console.log('\n📝 Next steps:');
    console.log('   - Test the frontend registration flow');
    console.log('   - Verify email delivery');
    console.log('   - Test OTP verification with correct code');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testOTPRegistration(); 