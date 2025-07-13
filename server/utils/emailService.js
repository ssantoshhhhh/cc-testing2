const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Send chat notification email
const sendChatNotification = async (recipientEmail, recipientName, senderName, productTitle, messageContent, chatUrl) => {
  try {
    const mailOptions = {
      from: `"CampusConnect" <${process.env.EMAIL_USER}>`,
      to: recipientEmail,
      subject: `New message from ${senderName} - CampusConnect`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">CampusConnect</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">You have a new message!</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">New Message</h2>
            
            <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #667eea;">
              <p style="margin: 0 0 10px 0; color: #666;">
                <strong>${senderName}</strong> sent you a message about:
              </p>
              <h3 style="margin: 0 0 10px 0; color: #333;">${productTitle}</h3>
              <div style="background: #f1f3f4; padding: 12px; border-radius: 6px; margin: 10px 0;">
                <p style="margin: 0; color: #333; font-style: italic;">"${messageContent}"</p>
              </div>
            </div>
            
            <div style="text-align: center; margin: 25px 0;">
              <a href="${chatUrl}" 
                 style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                View Chat
              </a>
            </div>
            
            <div style="border-top: 1px solid #ddd; padding-top: 15px; margin-top: 20px;">
              <p style="color: #666; font-size: 14px; margin: 0;">
                This email was sent from CampusConnect. 
                If you have any questions, please contact support.
              </p>
            </div>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Chat notification email sent to ${recipientEmail}`);
    return true;
  } catch (error) {
    console.error('Failed to send chat notification email:', error);
    return false;
  }
};

// Send welcome email for new chat
const sendNewChatNotification = async (recipientEmail, recipientName, senderName, productTitle, chatUrl) => {
  try {
    const mailOptions = {
      from: `"CampusConnect" <${process.env.EMAIL_USER}>`,
      to: recipientEmail,
      subject: `New chat started with ${senderName} - CampusConnect`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">CampusConnect</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">New chat started!</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">New Chat Started</h2>
            
            <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #28a745;">
              <p style="margin: 0 0 10px 0; color: #666;">
                <strong>${senderName}</strong> has started a new chat with you about:
              </p>
              <h3 style="margin: 0; color: #333;">${productTitle}</h3>
            </div>
            
            <div style="text-align: center; margin: 25px 0;">
              <a href="${chatUrl}" 
                 style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                View Chat
              </a>
            </div>
            
            <div style="border-top: 1px solid #ddd; padding-top: 15px; margin-top: 20px;">
              <p style="color: #666; font-size: 14px; margin: 0;">
                This email was sent from CampusConnect. 
                If you have any questions, please contact support.
              </p>
            </div>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`New chat notification email sent to ${recipientEmail}`);
    return true;
  } catch (error) {
    console.error('Failed to send new chat notification email:', error);
    return false;
  }
};

module.exports = {
  sendChatNotification,
  sendNewChatNotification
}; 