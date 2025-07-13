const axios = require('axios');

async function testAddProduct() {
  try {
    // First, let's test if the API is accessible
    console.log('Testing API accessibility...');
    const healthCheck = await axios.get('http://localhost:8001');
    console.log('API Health Check:', healthCheck.data);

    // Test the products endpoint
    console.log('\nTesting products endpoint...');
    const productsResponse = await axios.get('http://localhost:8001/api/products');
    console.log('Products Response:', productsResponse.data);

    // Test adding a product (should fail without auth)
    console.log('\nTesting add product without auth...');
    const testProduct = {
      title: 'Test Product',
      description: 'Test Description',
      category: 'books',
      price: 100,
      condition: 'good',
      images: ['placeholder-product.jpg'],
      contactInfo: {
        phone: '1234567890',
        email: 'test@test.com'
      },
      location: 'Test Location'
    };

    try {
      const addResponse = await axios.post('http://localhost:8001/api/products', testProduct);
      console.log('Add Product Response:', addResponse.data);
    } catch (error) {
      console.log('Expected error (no auth):', error.response?.data);
    }

  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testAddProduct(); 