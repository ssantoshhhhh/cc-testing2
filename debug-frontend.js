const axios = require('axios');

async function debugFrontend() {
  try {
    console.log('Testing frontend authentication flow...');
    
    // Step 1: Login
    console.log('\n1. Logging in...');
    const loginData = {
      email: 'test@example.com',
      password: 'password123'
    };

    const loginResponse = await axios.post('http://localhost:8001/api/auth/login', loginData, {
      withCredentials: true
    });
    
    console.log('Login successful:', loginResponse.data.success);
    
    // Step 2: Check if we can access protected routes
    console.log('\n2. Testing protected route access...');
    const meResponse = await axios.get('http://localhost:8001/api/auth/me', {
      withCredentials: true
    });
    
    console.log('Me endpoint response:', meResponse.data);
    
    // Step 3: Try to add a product
    console.log('\n3. Testing product creation...');
    const productData = {
      title: 'Debug Test Product',
      description: 'This is a test product for debugging',
      category: 'books',
      price: 50,
      condition: 'good',
      images: ['placeholder-product.jpg'],
      contactInfo: {
        phone: '1234567890',
        email: 'test@test.com'
      },
      location: 'Test Location'
    };

    const productResponse = await axios.post('http://localhost:8001/api/products', productData, {
      withCredentials: true
    });
    
    console.log('Product creation response:', productResponse.data);

  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

debugFrontend(); 