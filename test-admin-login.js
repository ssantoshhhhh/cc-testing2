const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config({ path: './config.env' });

async function testAdminLogin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/campus_connect');
    console.log('MongoDB connected for admin test');
    
    const email = 'admin@campusconnect.com';
    const password = 'admin123';
    
    // Find the admin user
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      console.log('❌ Admin user not found');
      return;
    }
    
    console.log('✅ Admin user found:');
    console.log('Name:', user.name);
    console.log('Email:', user.email);
    console.log('Role:', user.role);
    console.log('Password hash exists:', !!user.password);
    
    // Test password comparison
    const isMatch = await user.comparePassword(password);
    console.log('Password match:', isMatch);
    
    if (isMatch) {
      console.log('✅ Admin login should work');
    } else {
      console.log('❌ Password does not match');
    }
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testAdminLogin(); 