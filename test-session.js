const axios = require('axios');

async function testSession() {
  try {
    // Create a session by logging in
    console.log('Testing session-based login...');
    
    const loginData = {
      email: 'test@example.com',
      password: 'password123'
    };

    // First, make a request to establish session
    const sessionResponse = await axios.post('http://localhost:8001/api/auth/login', loginData, {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Login Response:', sessionResponse.data);
    console.log('Cookies:', sessionResponse.headers['set-cookie']);

    // Now test the /me endpoint with the session
    console.log('\nTesting /me endpoint with session...');
    const meResponse = await axios.get('http://localhost:8001/api/auth/me', {
      withCredentials: true,
      headers: {
        'Cookie': sessionResponse.headers['set-cookie']?.join('; ')
      }
    });
    
    console.log('Me Response:', meResponse.data);

  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testSession(); 