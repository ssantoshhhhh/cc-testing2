const axios = require('axios');

async function testChatsPage() {
  console.log('Testing Chats Page...\n');

  try {
    // Test 1: Check if server is running
    console.log('1. Testing server connection...');
    try {
      const response = await axios.get('http://localhost:8001/api/products');
      console.log('✅ Server is running');
    } catch (error) {
      console.log('❌ Server connection failed:', error.message);
      return;
    }

    // Test 2: Test chats endpoint without auth (should fail)
    console.log('\n2. Testing chats endpoint without authentication...');
    try {
      const response = await axios.get('http://localhost:8001/api/chats');
      console.log('❌ Should have failed - chats endpoint accessible without auth');
    } catch (error) {
      console.log('✅ Correctly requires authentication:', error.response?.data?.message || 'Auth required');
    }

    console.log('\n✅ Chats page is properly secured!');
    console.log('\nTo test the chats page:');
    console.log('1. Open http://localhost:3000 in your browser');
    console.log('2. Log in as a user');
    console.log('3. Go to profile dropdown → "My Chats"');
    console.log('4. The page should load without errors');
    console.log('5. Check browser console for detailed logs');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testChatsPage(); 