const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Configure axios
const api = axios.create({
  baseURL: 'http://localhost:8001',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Test user credentials
const testUser = {
  email: 'test@example.com',
  password: 'password123'
};

let sessionCookie = '';

async function login() {
  try {
    console.log('🔐 Logging in...');
    const response = await api.post('/api/auth/login', testUser);
    
    if (response.data.success) {
      console.log('✅ Login successful');
      // Extract session cookie
      const setCookieHeader = response.headers['set-cookie'];
      if (setCookieHeader) {
        sessionCookie = setCookieHeader[0];
        api.defaults.headers.Cookie = sessionCookie;
      }
      return response.data.user;
    } else {
      console.log('❌ Login failed');
      return null;
    }
  } catch (error) {
    console.error('❌ Login error:', error.response?.data || error.message);
    return null;
  }
}

async function uploadProfilePicture(imagePath) {
  try {
    console.log('📤 Uploading profile picture...');
    
    const formData = new FormData();
    formData.append('profilePicture', fs.createReadStream(imagePath));
    
    const response = await api.post('/api/users/upload-profile-picture', formData, {
      headers: {
        ...formData.getHeaders(),
      },
    });
    
    if (response.data.success) {
      console.log('✅ Profile picture uploaded successfully');
      console.log('📊 User data after upload:', {
        hasProfilePicture: response.data.user.hasProfilePicture,
        id: response.data.user.id
      });
      return response.data.user;
    } else {
      console.log('❌ Upload failed');
      return null;
    }
  } catch (error) {
    console.error('❌ Upload error:', error.response?.data || error.message);
    return null;
  }
}

async function deleteProfilePicture() {
  try {
    console.log('🗑️ Deleting profile picture...');
    
    const response = await api.delete('/api/users/profile-picture');
    
    if (response.data.success) {
      console.log('✅ Profile picture deleted successfully');
      console.log('📊 User data after deletion:', {
        hasProfilePicture: response.data.user.hasProfilePicture,
        id: response.data.user.id
      });
      return response.data.user;
    } else {
      console.log('❌ Deletion failed');
      return null;
    }
  } catch (error) {
    console.error('❌ Deletion error:', error.response?.data || error.message);
    return null;
  }
}

async function getProfilePicture(userId) {
  try {
    console.log('🖼️ Getting profile picture...');
    
    const response = await api.get(`/api/users/profile-picture/${userId}`, {
      responseType: 'arraybuffer'
    });
    
    if (response.status === 200) {
      console.log('✅ Profile picture retrieved successfully');
      console.log('📊 Response headers:', {
        'content-type': response.headers['content-type'],
        'content-length': response.headers['content-length']
      });
      return true;
    } else {
      console.log('❌ Profile picture retrieval failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Profile picture retrieval error:', error.response?.status || error.message);
    return false;
  }
}

async function getUserProfile() {
  try {
    console.log('👤 Getting user profile...');
    
    const response = await api.get('/api/users/profile');
    
    if (response.data.success) {
      console.log('✅ User profile retrieved successfully');
      console.log('📊 User data:', {
        hasProfilePicture: response.data.data.hasProfilePicture,
        id: response.data.data._id
      });
      return response.data.data;
    } else {
      console.log('❌ Profile retrieval failed');
      return null;
    }
  } catch (error) {
    console.error('❌ Profile retrieval error:', error.response?.data || error.message);
    return null;
  }
}

async function testProfilePictureFlow() {
  console.log('🚀 Starting Profile Picture Flow Test\n');
  
  // Step 1: Login
  const user = await login();
  if (!user) {
    console.log('❌ Cannot proceed without login');
    return;
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Step 2: Check initial state
  console.log('📋 Step 1: Checking initial profile state');
  const initialProfile = await getUserProfile();
  if (initialProfile) {
    console.log(`Initial hasProfilePicture: ${initialProfile.hasProfilePicture}`);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Step 3: Upload profile picture
  console.log('📋 Step 2: Uploading profile picture');
  const imagePath = path.join(__dirname, 'client', 'public', 'placeholder-product.jpg');
  
  if (!fs.existsSync(imagePath)) {
    console.log('❌ Test image not found, creating a dummy image...');
    // Create a simple test image
    const dummyImagePath = path.join(__dirname, 'test-image.jpg');
    const dummyImageData = Buffer.from('fake-image-data');
    fs.writeFileSync(dummyImagePath, dummyImageData);
    
    const uploadResult = await uploadProfilePicture(dummyImagePath);
    if (uploadResult) {
      console.log('✅ Upload successful with dummy image');
    }
    
    // Clean up dummy image
    fs.unlinkSync(dummyImagePath);
  } else {
    const uploadResult = await uploadProfilePicture(imagePath);
    if (uploadResult) {
      console.log('✅ Upload successful with placeholder image');
    }
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Step 4: Verify profile picture exists
  console.log('📋 Step 3: Verifying profile picture exists');
  const profileAfterUpload = await getUserProfile();
  if (profileAfterUpload && profileAfterUpload.hasProfilePicture) {
    console.log('✅ Profile picture flag is set to true');
    
    // Try to get the actual image
    const imageExists = await getProfilePicture(profileAfterUpload._id);
    if (imageExists) {
      console.log('✅ Profile picture can be retrieved');
    } else {
      console.log('❌ Profile picture cannot be retrieved');
    }
  } else {
    console.log('❌ Profile picture flag is not set correctly');
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Step 5: Delete profile picture
  console.log('📋 Step 4: Deleting profile picture');
  const deleteResult = await deleteProfilePicture();
  if (deleteResult) {
    console.log('✅ Deletion successful');
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Step 6: Verify profile picture is deleted
  console.log('📋 Step 5: Verifying profile picture is deleted');
  const profileAfterDelete = await getUserProfile();
  if (profileAfterDelete && !profileAfterDelete.hasProfilePicture) {
    console.log('✅ Profile picture flag is set to false');
  } else {
    console.log('❌ Profile picture flag is not set correctly after deletion');
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Step 7: Upload new profile picture
  console.log('📋 Step 6: Uploading new profile picture');
  const newUploadResult = await uploadProfilePicture(imagePath);
  if (newUploadResult) {
    console.log('✅ New upload successful');
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Step 8: Verify new profile picture
  console.log('📋 Step 7: Verifying new profile picture');
  const finalProfile = await getUserProfile();
  if (finalProfile && finalProfile.hasProfilePicture) {
    console.log('✅ New profile picture flag is set to true');
    
    // Try to get the actual image
    const newImageExists = await getProfilePicture(finalProfile._id);
    if (newImageExists) {
      console.log('✅ New profile picture can be retrieved');
    } else {
      console.log('❌ New profile picture cannot be retrieved');
    }
  } else {
    console.log('❌ New profile picture flag is not set correctly');
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  console.log('🎉 Profile Picture Flow Test Completed!');
}

// Run the test
testProfilePictureFlow().catch(console.error); 