const axios = require('axios');

const BASE_URL = 'http://localhost:8001/api';

async function testAccountDeletionEndpoints() {
  try {
    console.log('🧪 Testing Account Deletion API Endpoints...\n');

    console.log('1️⃣ Testing send delete account OTP without authentication...');
    try {
      await axios.post(`${BASE_URL}/auth/send-delete-account-otp`);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Correctly requires authentication:', error.response.data.message);
      } else {
        console.log('❌ Unexpected error:', error.response?.data || error.message);
      }
    }

    console.log('\n2️⃣ Testing verify delete account OTP without authentication...');
    try {
      await axios.post(`${BASE_URL}/auth/verify-delete-account-otp`, { otp: '123456' });
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Correctly requires authentication:', error.response.data.message);
      } else {
        console.log('❌ Unexpected error:', error.response?.data || error.message);
      }
    }

    console.log('\n3️⃣ Testing resend delete account OTP without authentication...');
    try {
      await axios.post(`${BASE_URL}/auth/resend-delete-account-otp`);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Correctly requires authentication:', error.response.data.message);
      } else {
        console.log('❌ Unexpected error:', error.response?.data || error.message);
      }
    }

    console.log('\n4️⃣ Testing admin users endpoint without authentication...');
    try {
      await axios.get(`${BASE_URL}/admin/users`);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Correctly requires authentication:', error.response.data.message);
      } else {
        console.log('❌ Unexpected error:', error.response?.data || error.message);
      }
    }

    console.log('\n🎉 Account deletion API endpoint tests completed!');
    console.log('\n📝 Next steps:');
    console.log('   - Create a test user using create-test-deletion-user.js');
    console.log('   - Login with the test user');
    console.log('   - Test the account deletion flow in the frontend');
    console.log('   - Verify email delivery for OTP');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

async function testEmailConfiguration() {
  try {
    console.log('\n🧪 Testing Email Configuration...\n');

    console.log('1️⃣ Checking environment variables...');
    const requiredVars = ['EMAIL_USER', 'EMAIL_PASS'];
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.log('⚠️ Missing environment variables:', missingVars.join(', '));
      console.log('   Please set these in your .env file');
    } else {
      console.log('✅ All required environment variables are set');
    }

    console.log('\n2️⃣ Testing nodemailer configuration...');
    const nodemailer = require('nodemailer');
    
    try {
      const transporter = nodemailer.createTransporter({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });

      // Test the connection
      await transporter.verify();
      console.log('✅ Email configuration is valid');
    } catch (emailError) {
      console.log('❌ Email configuration error:', emailError.message);
      console.log('   Please check your Gmail credentials and app password');
    }

  } catch (error) {
    console.error('❌ Email configuration test failed:', error.message);
  }
}

// Run tests
async function runTests() {
  await testAccountDeletionEndpoints();
  await testEmailConfiguration();
}

runTests().catch(console.error); 