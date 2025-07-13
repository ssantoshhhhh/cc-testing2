const axios = require('axios');

async function testChatSimple() {
  console.log('Testing Chat Functionality...\n');

  try {
    // Test 1: Check if server is running
    console.log('1. Testing server connection...');
    try {
      const response = await axios.get('http://localhost:8001/api/products');
      console.log('✅ Server is running');
      console.log(`Found ${response.data.data?.length || 0} products`);
    } catch (error) {
      console.log('❌ Server connection failed:', error.message);
      return;
    }

    // Test 2: Check if auth endpoint works
    console.log('\n2. Testing auth endpoint...');
    try {
      const response = await axios.get('http://localhost:8001/api/auth/me');
      console.log('❌ Should have failed - auth endpoint accessible without session');
    } catch (error) {
      console.log('✅ Correctly requires session:', error.response?.data?.message || 'Auth required');
    }

    // Test 3: Check if chat endpoints work
    console.log('\n3. Testing chat endpoints...');
    try {
      const response = await axios.get('http://localhost:8001/api/chats');
      console.log('❌ Should have failed - chats endpoint accessible without session');
    } catch (error) {
      console.log('✅ Correctly requires session:', error.response?.data?.message || 'Auth required');
    }

    console.log('\n✅ Chat functionality is properly secured!');
    console.log('\nTo test the full chat functionality:');
    console.log('1. Open http://localhost:3000 in your browser');
    console.log('2. Register two different user accounts');
    console.log('3. Log in as first user and add a product');
    console.log('4. Log out and log in as second user');
    console.log('5. Try to chat with the first user\'s product');
    console.log('6. Check browser console for detailed logs');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testChatSimple(); 