const nodemailer = require('nodemailer');
require('dotenv').config({ path: './config.env' });

async function testGmailAuth() {
  console.log('Testing Gmail authentication...');
  console.log('Email User:', process.env.EMAIL_USER);
  console.log('Email Pass length:', process.env.EMAIL_PASS?.length || 0);
  
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  try {
    // Test the connection
    await transporter.verify();
    console.log('✅ Gmail authentication successful!');
    
    // Try to send a test email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: 'srkrcampusconnect@gmail.com',
      subject: 'Test Email - Gmail Auth Working',
      text: 'This is a test email to verify Gmail authentication is working.',
      html: '<h2>Test Email</h2><p>Gmail authentication is working correctly!</p>'
    };
    
    await transporter.sendMail(mailOptions);
    console.log('✅ Test email sent successfully!');
    
  } catch (error) {
    console.error('❌ Gmail authentication failed:');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    if (error.code === 'EAUTH') {
      console.log('\n🔧 Troubleshooting tips:');
      console.log('1. Make sure 2-Step Verification is enabled on your Gmail account');
      console.log('2. Generate an App Password:');
      console.log('   - Go to Google Account → Security → 2-Step Verification → App passwords');
      console.log('   - Select "Mail" and generate a new password');
      console.log('   - Use the 16-character app password (no spaces)');
    }
  }
}

testGmailAuth(); 