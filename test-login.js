const axios = require('axios');

async function testLogin() {
  try {
    // Test login endpoint
    console.log('Testing login endpoint...');
    
    const loginData = {
      email: 'test@example.com',
      password: 'password123'
    };

    const loginResponse = await axios.post('http://localhost:8001/api/auth/login', loginData, {
      withCredentials: true
    });
    
    console.log('Login Response:', loginResponse.data);

    // If login successful, test adding a product
    if (loginResponse.data.success) {
      console.log('\nTesting add product after login...');
      
      const testProduct = {
        title: 'Test Product via Login',
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

      const addResponse = await axios.post('http://localhost:8001/api/products', testProduct, {
        withCredentials: true
      });
      
      console.log('Add Product Response:', addResponse.data);
    }

  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testLogin(); 