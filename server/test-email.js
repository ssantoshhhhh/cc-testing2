require('dotenv').config({ path: './config.env' });
const nodemailer = require('nodemailer');

async function sendTestEmail() {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: 'srkrcampusconnect@gmail.com',
      subject: 'CampusConnect Test Email',
      text: 'This is a test email from your CampusConnect server. If you received this, your email setup is working!'
    };

    await transporter.sendMail(mailOptions);
    console.log('Test email sent successfully!');
  } catch (error) {
    console.error('Failed to send test email:', error);
  }
}

sendTestEmail(); 