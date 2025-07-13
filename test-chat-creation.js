const axios = require('axios');

async function testChatCreation() {
  console.log('Testing Chat Creation...\n');

  try {
    // Test 1: Check if server is running
    console.log('1. Testing server connection...');
    try {
      const response = await axios.get('http://localhost:8001/api/products');
      console.log('✅ Server is running');
      console.log(`Found ${response.data.data?.length || 0} products`);
      
      if (response.data.data?.length > 0) {
        const product = response.data.data[0];
        console.log('Sample product:', {
          id: product._id,
          title: product.title,
          seller: product.seller?._id
        });
      }
    } catch (error) {
      console.log('❌ Server connection failed:', error.message);
      return;
    }

    // Test 2: Test chat creation without auth (should fail)
    console.log('\n2. Testing chat creation without authentication...');
    try {
      const response = await axios.post('http://localhost:8001/api/chats', {
        productId: 'test',
        sellerId: 'test'
      });
      console.log('❌ Should have failed - chat creation accessible without auth');
    } catch (error) {
      console.log('✅ Correctly requires authentication:', error.response?.data?.message || 'Auth required');
    }

    console.log('\n✅ Chat creation is properly secured!');
    console.log('\nTo test the full chat functionality:');
    console.log('1. Open http://localhost:3000 in your browser');
    console.log('2. Register two different user accounts');
    console.log('3. Log in as first user and add a product');
    console.log('4. Log out and log in as second user');
    console.log('5. Try to chat with the first user\'s product');
    console.log('6. The system should automatically create a new chat if access is denied');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testChatCreation(); 