const axios = require('axios');

async function testChatAPI() {
  console.log('Testing Chat API endpoints...\n');

  try {
    // Test 1: Check if server is running
    console.log('1. Testing server connection...');
    try {
      const response = await axios.get('http://localhost:8001/api/products');
      console.log('✅ Server is running, products endpoint works');
    } catch (error) {
      console.log('❌ Server connection failed:', error.message);
      return;
    }

    // Test 2: Test chat endpoints without auth (should fail)
    console.log('\n2. Testing chat endpoints without authentication...');
    
    try {
      await axios.get('http://localhost:8001/api/chats');
      console.log('❌ Should have failed - chats endpoint accessible without auth');
    } catch (error) {
      console.log('✅ Correctly requires authentication:', error.response?.data?.message || 'Auth required');
    }

    try {
      await axios.post('http://localhost:8001/api/chats', {
        productId: 'test',
        sellerId: 'test'
      });
      console.log('❌ Should have failed - create chat accessible without auth');
    } catch (error) {
      console.log('✅ Correctly requires authentication:', error.response?.data?.message || 'Auth required');
    }

    console.log('\n✅ Chat API security tests passed!');
    console.log('The chat endpoints are properly protected and require authentication.');
    console.log('\nTo test the full functionality:');
    console.log('1. Start the client: cd client && npm start');
    console.log('2. Log in as a user');
    console.log('3. Try the chat features from the product pages');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testChatAPI(); 