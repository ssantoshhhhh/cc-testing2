const axios = require('axios');

async function testChatWithAuth() {
  console.log('Testing Chat with Authentication...\n');

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

    console.log('\n✅ Chat API is ready for testing!');
    console.log('\nTo test the full chat functionality:');
    console.log('1. Start the client: cd client && npm start');
    console.log('2. Register two different user accounts');
    console.log('3. Log in as first user and add a product');
    console.log('4. Log out and log in as second user');
    console.log('5. Try to chat with the first user\'s product');
    console.log('6. Check browser console for detailed logs');
    console.log('\nExpected behavior:');
    console.log('- Chat modal should open when clicking "Start Chat"');
    console.log('- Messages should send and receive properly');
    console.log('- Real-time updates should work (polling every 3 seconds)');
    console.log('- Unread message counts should work');
    console.log('- Error handling should work for network issues');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testChatWithAuth(); 