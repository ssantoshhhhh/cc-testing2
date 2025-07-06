const axios = require('axios');

const BASE_URL = 'http://localhost:8001/api';
const ADMIN_EMAIL = 'admin@campusconnect.com';
const ADMIN_PASSWORD = 'admin123';

async function simpleTest() {
  try {
    console.log('🧪 Simple Admin Login Test...\n');

    // Test admin login
    console.log('1. Testing admin login...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });
    
    const token = loginResponse.data.token;
    const authHeader = { headers: { Authorization: `Bearer ${token}` } };
    console.log('✅ Admin login successful');
    console.log('Token received:', token ? 'Yes' : 'No');

    // Test inventory endpoint
    console.log('\n2. Testing inventory endpoint...');
    try {
      const inventoryResponse = await axios.get(`${BASE_URL}/admin/products/inventory`, authHeader);
      console.log('✅ Inventory endpoint accessible');
      console.log('Products count:', inventoryResponse.data.data.products.length);
    } catch (error) {
      console.log('❌ Inventory endpoint failed:', error.response?.data);
    }

    // Test reduce stock endpoint
    console.log('\n3. Testing reduce stock endpoint...');
    try {
      const productsResponse = await axios.get(`${BASE_URL}/admin/products/inventory`, authHeader);
      const products = productsResponse.data.data.products;
      
      if (products.length > 0) {
        const testProduct = products[0];
        console.log(`Testing with product: ${testProduct.name}`);
        
        const reduceResponse = await axios.post(
          `${BASE_URL}/admin/products/${testProduct._id}/reduce-stock`,
          { quantity: 1 },
          authHeader
        );
        console.log('✅ Reduce stock endpoint works');
        console.log('Updated product:', reduceResponse.data.data.name);
      } else {
        console.log('No products available for testing');
      }
    } catch (error) {
      console.log('❌ Reduce stock endpoint failed:', error.response?.data);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

simpleTest(); 