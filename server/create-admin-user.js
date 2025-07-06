const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config({ path: './config.env' });

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/campus_connect');
    console.log('MongoDB connected for admin creation');
    
    const email = 'admin@campusconnect.com';
    const password = 'admin123';

    // Check if admin user already exists
    let user = await User.findOne({ email });
    
    if (user) {
      // Update existing user - set plain password and let pre-save hook hash it
      user.password = password;
      user.role = 'admin';
      user.name = 'Admin User';
      user.studentId = 'ADMIN001';
      user.phone = '1234567890';
      user.department = 'Administration';
      await user.save();
      console.log('✅ Admin user updated successfully');
    } else {
      // Create new admin user - set plain password and let pre-save hook hash it
      user = new User({
        name: 'Admin User',
        email,
        password: password,
        role: 'admin',
        studentId: 'ADMIN001',
        phone: '1234567890',
        department: 'Administration'
      });
      await user.save();
      console.log('✅ Admin user created successfully');
    }
    
    console.log('\nAdmin credentials:');
    console.log('Email: admin@campusconnect.com');
    console.log('Password: admin123');
    console.log('Role: admin');
    
    await mongoose.disconnect();
    console.log('✅ Database connection closed');
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  }
}

createAdmin(); 