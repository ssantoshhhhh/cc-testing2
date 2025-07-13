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

// Send buy request notification to seller
const sendBuyRequestNotification = async (recipientEmail, recipientName, buyerName, productTitle, offeredPrice, message, requestUrl) => {
  try {
    const mailOptions = {
      from: `"CampusConnect" <${process.env.EMAIL_USER}>`,
      to: recipientEmail,
      subject: `New buy request from ${buyerName} - CampusConnect`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">CampusConnect</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">New buy request!</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Buy Request</h2>
            
            <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #28a745;">
              <p style="margin: 0 0 10px 0; color: #666;">
                <strong>${buyerName}</strong> wants to buy your product:
              </p>
              <h3 style="margin: 0 0 10px 0; color: #333;">${productTitle}</h3>
              <div style="background: #e8f5e8; padding: 12px; border-radius: 6px; margin: 10px 0;">
                <p style="margin: 0; color: #155724; font-weight: bold;">
                  Offered Price: $${offeredPrice}
                </p>
              </div>
              ${message ? `
                <div style="background: #f1f3f4; padding: 12px; border-radius: 6px; margin: 10px 0;">
                  <p style="margin: 0; color: #333; font-style: italic;">"${message}"</p>
                </div>
              ` : ''}
            </div>
            
            <div style="text-align: center; margin: 25px 0;">
              <a href="${requestUrl}" 
                 style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                View Request
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
    console.log(`Buy request notification email sent to ${recipientEmail}`);
    return true;
  } catch (error) {
    console.error('Failed to send buy request notification email:', error);
    return false;
  }
};

// Send buy request status notification to buyer
const sendBuyRequestStatusNotification = async (recipientEmail, recipientName, sellerName, productTitle, status, requestUrl) => {
  try {
    const statusColors = {
      'accepted': '#28a745',
      'rejected': '#dc3545',
      'completed': '#17a2b8'
    };
    
    const statusText = {
      'accepted': 'accepted',
      'rejected': 'rejected',
      'completed': 'completed'
    };

    const mailOptions = {
      from: `"CampusConnect" <${process.env.EMAIL_USER}>`,
      to: recipientEmail,
      subject: `Your buy request has been ${statusText[status]} - CampusConnect`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, ${statusColors[status]} 0%, ${statusColors[status]}dd 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">CampusConnect</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">Buy request ${statusText[status]}!</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Request ${statusText[status].charAt(0).toUpperCase() + statusText[status].slice(1)}</h2>
            
            <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid ${statusColors[status]};">
              <p style="margin: 0 0 10px 0; color: #666;">
                <strong>${sellerName}</strong> has ${statusText[status]} your buy request for:
              </p>
              <h3 style="margin: 0; color: #333;">${productTitle}</h3>
            </div>
            
            <div style="text-align: center; margin: 25px 0;">
              <a href="${requestUrl}" 
                 style="background: ${statusColors[status]}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                View Details
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
    console.log(`Buy request status notification email sent to ${recipientEmail}`);
    return true;
  } catch (error) {
    console.error('Failed to send buy request status notification email:', error);
    return false;
  }
};

// Send contact form email to admin
const sendContactEmail = async ({ firstName, lastName, email, subject, message }) => {
  const mailOptions = {
    from: `CampusConnect Contact <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_USER,
    subject: `Contact Form: ${subject}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${firstName} ${lastName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <div style="background: #f8f9fa; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p style="margin: 0; color: #333;"><strong>Message:</strong></p>
          <p style="margin: 0; color: #333;">${message}</p>
        </div>
      </div>
    `
  };
  await transporter.sendMail(mailOptions);
};

module.exports = {
  sendChatNotification,
  sendNewChatNotification,
  sendBuyRequestNotification,
  sendBuyRequestStatusNotification
};

module.exports.sendContactEmail = sendContactEmail; 