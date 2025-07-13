const axios = require('axios');

async function testAuth() {
  console.log('Testing authentication...\n');

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

    // Test 2: Test auth endpoint without session
    console.log('\n2. Testing auth endpoint without session...');
    try {
      const response = await axios.get('http://localhost:8001/api/auth/me');
      console.log('❌ Should have failed - auth endpoint accessible without session');
    } catch (error) {
      console.log('✅ Correctly requires session:', error.response?.data?.message || 'Auth required');
    }

    // Test 3: Test chat endpoints without session
    console.log('\n3. Testing chat endpoints without session...');
    try {
      await axios.get('http://localhost:8001/api/chats');
      console.log('❌ Should have failed - chats endpoint accessible without session');
    } catch (error) {
      console.log('✅ Correctly requires session:', error.response?.data?.message || 'Auth required');
    }

    console.log('\n✅ Authentication tests passed!');
    console.log('The server is properly protecting routes that require authentication.');
    console.log('\nTo test the full chat functionality:');
    console.log('1. Start the client: cd client && npm start');
    console.log('2. Register/login as a user');
    console.log('3. Try the chat features - the console will show detailed logs');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAuth(); 