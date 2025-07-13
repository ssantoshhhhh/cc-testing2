const axios = require('axios');
const FormData = require('form-data');

const BASE_URL = 'http://localhost:8001/api';

async function testProfilePictureUpload() {
  try {
    console.log('🧪 Testing Profile Picture Upload Flow...\n');

    // First, login to get authentication
    console.log('1️⃣ Logging in to get authentication...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@campusconnect.com',
      password: 'admin123'
    }, {
      withCredentials: true // Important for session cookies
    });
    
    const userId = loginResponse.data.user.id;
    
    console.log('✅ Login successful');

    // Test profile picture upload
    console.log('\n2️⃣ Testing profile picture upload...');
    
    // Create a simple test image (1x1 pixel PNG)
    const testImageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
    
    const formData = new FormData();
    formData.append('profilePicture', testImageBuffer, {
      filename: 'test.png',
      contentType: 'image/png'
    });

    const uploadResponse = await axios.post(`${BASE_URL}/users/upload-profile-picture`, formData, {
      headers: {
        ...formData.getHeaders(),
      },
      withCredentials: true // Important for session cookies
    });

    console.log('✅ Profile picture upload successful:', uploadResponse.data.message);

    // Test profile picture retrieval
    console.log('\n3️⃣ Testing profile picture retrieval...');
    const imageResponse = await axios.get(`${BASE_URL}/users/profile-picture/${userId}`, {
      responseType: 'arraybuffer',
      withCredentials: true
    });
    
    console.log('✅ Profile picture retrieval successful');
    console.log('Image size:', imageResponse.data.length, 'bytes');

    // Test profile picture deletion
    console.log('\n4️⃣ Testing profile picture deletion...');
    const deleteResponse = await axios.delete(`${BASE_URL}/users/profile-picture`, {
      withCredentials: true
    });

    console.log('✅ Profile picture deletion successful:', deleteResponse.data.message);

    // Test invalid file upload
    console.log('\n5️⃣ Testing invalid file upload...');
    try {
      const invalidFormData = new FormData();
      invalidFormData.append('profilePicture', Buffer.from('invalid file'), {
        filename: 'test.txt',
        contentType: 'text/plain'
      });

      await axios.post(`${BASE_URL}/users/upload-profile-picture`, invalidFormData, {
        headers: {
          ...invalidFormData.getHeaders(),
        },
        withCredentials: true
      });
    } catch (error) {
      console.log('✅ Invalid file correctly rejected:', error.response.data.message);
    }

    console.log('\n🎉 Profile Picture Upload flow test completed!');
    console.log('\n📝 Features tested:');
    console.log('   - Profile picture upload');
    console.log('   - Profile picture retrieval');
    console.log('   - Profile picture deletion');
    console.log('   - Invalid file rejection');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testProfilePictureUpload(); 