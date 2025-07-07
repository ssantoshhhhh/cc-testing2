const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testUsersAPI() {
  try {
    console.log('🧪 Testing Users API...\n');

    // Test 1: Get all users
    console.log('1. Testing GET /api/admin/users');
    try {
      const response = await axios.get(`${BASE_URL}/admin/users`);
      console.log('✅ Success:', response.data.data.length, 'users found');
      if (response.data.data.length > 0) {
        const user = response.data.data[0];
        console.log('   Sample user:', {
          name: user.name,
          email: user.email,
          isActive: user.isActive,
          totalRentals: user.totalRentals,
          successfulOrders: user.successfulOrders,
          declinedOrders: user.declinedOrders,
          activeRentals: user.activeRentals
        });
      }
    } catch (error) {
      console.log('❌ Error:', error.response?.data?.message || error.message);
    }

    // Test 2: Get active users
    console.log('\n2. Testing GET /api/admin/users?status=active');
    try {
      const response = await axios.get(`${BASE_URL}/admin/users?status=active`);
      console.log('✅ Success:', response.data.data.length, 'active users found');
    } catch (error) {
      console.log('❌ Error:', error.response?.data?.message || error.message);
    }

    // Test 3: Get inactive users
    console.log('\n3. Testing GET /api/admin/users?status=inactive');
    try {
      const response = await axios.get(`${BASE_URL}/admin/users?status=inactive`);
      console.log('✅ Success:', response.data.data.length, 'inactive users found');
    } catch (error) {
      console.log('❌ Error:', error.response?.data?.message || error.message);
    }

    console.log('\n🎉 Users API tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testUsersAPI(); 