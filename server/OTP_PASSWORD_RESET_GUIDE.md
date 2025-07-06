# OTP Password Reset System Guide

## Overview
This system implements a secure OTP (One-Time Password) based password reset functionality using Nodemailer for email delivery.

## Features
- ✅ 6-digit OTP generation
- ✅ 10-minute OTP expiration
- ✅ Beautiful HTML email templates
- ✅ Resend OTP functionality
- ✅ Password update in database
- ✅ Confirmation emails
- ✅ Comprehensive error handling

## API Endpoints

### 1. Request Password Reset OTP
**POST** `/api/auth/forgot-password`

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent to your email address"
}
```

### 2. Verify OTP and Reset Password
**POST** `/api/auth/verify-otp`

**Request Body:**
```json
{
  "email": "user@example.com",
  "otp": "123456",
  "password": "newpassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset successful"
}
```

### 3. Resend OTP
**POST** `/api/auth/resend-otp`

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "New OTP sent to your email address"
}
```

## Email Templates

### Password Reset OTP Email
- **Subject**: "Password Reset OTP - Campus Connect"
- **Content**: Professional HTML email with:
  - User's name
  - 6-digit OTP prominently displayed
  - Security instructions
  - 10-minute validity notice

### Password Reset Success Email
- **Subject**: "Password Reset Successful - Campus Connect"
- **Content**: Confirmation email with:
  - Success message
  - Security warning if user didn't perform the action

### Resend OTP Email
- **Subject**: "New Password Reset OTP - Campus Connect"
- **Content**: Same as original OTP email but with "New" indicator

## Database Schema Updates

The User model now includes:
```javascript
resetPasswordOTP: String,        // Stores the 6-digit OTP
resetPasswordOTPExpire: Date,    // OTP expiration timestamp
```

## Security Features

1. **OTP Expiration**: 10-minute validity period
2. **OTP Cleanup**: OTP is cleared after successful password reset
3. **Email Validation**: Ensures email exists before sending OTP
4. **Error Handling**: Comprehensive error messages for different scenarios
5. **Rate Limiting**: Can be added for additional security

## Error Responses

### User Not Found
```json
{
  "message": "User not found"
}
```

### Invalid OTP
```json
{
  "message": "Invalid OTP"
}
```

### Expired OTP
```json
{
  "message": "OTP has expired"
}
```

### Validation Errors
```json
{
  "errors": [
    {
      "type": "field",
      "value": "invalid-email",
      "msg": "Please enter a valid email",
      "path": "email",
      "location": "body"
    }
  ]
}
```

## Testing

### Test with Real Email
1. Use a real email address that exists in your database
2. Check your email for the OTP
3. Use the OTP to reset the password

### Test Error Scenarios
1. **Non-existent email**: Should return "User not found"
2. **Invalid OTP**: Should return "Invalid OTP"
3. **Expired OTP**: Wait 10+ minutes, then try to use the OTP
4. **Invalid email format**: Should return validation error

## Frontend Integration

### Example React Component Usage
```javascript
// Request OTP
const requestOTP = async (email) => {
  try {
    const response = await axios.post('/api/auth/forgot-password', { email });
    console.log('OTP sent:', response.data);
  } catch (error) {
    console.error('Error:', error.response.data);
  }
};

// Verify OTP and reset password
const resetPassword = async (email, otp, newPassword) => {
  try {
    const response = await axios.post('/api/auth/verify-otp', {
      email,
      otp,
      password: newPassword
    });
    console.log('Password reset successful:', response.data);
  } catch (error) {
    console.error('Error:', error.response.data);
  }
};

// Resend OTP
const resendOTP = async (email) => {
  try {
    const response = await axios.post('/api/auth/resend-otp', { email });
    console.log('New OTP sent:', response.data);
  } catch (error) {
    console.error('Error:', error.response.data);
  }
};
```

## Configuration

### Environment Variables Required
```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

### Gmail Setup
1. Enable 2-factor authentication
2. Generate an App Password
3. Use the App Password in EMAIL_PASS

## Troubleshooting

### Common Issues

1. **Email not sending**
   - Check Gmail credentials
   - Verify App Password is correct
   - Check if 2FA is enabled

2. **OTP not working**
   - Check if OTP is expired (10 minutes)
   - Verify OTP is exactly 6 digits
   - Ensure email exists in database

3. **Database errors**
   - Check MongoDB connection
   - Verify User model has OTP fields
   - Check database permissions

## Security Best Practices

1. **Rate Limiting**: Consider adding rate limiting to prevent abuse
2. **OTP Complexity**: Current 6-digit OTP provides good security
3. **Expiration Time**: 10 minutes is a good balance between security and usability
4. **Email Validation**: Always validate email format and existence
5. **Error Messages**: Don't reveal if email exists or not (security through obscurity)

## Future Enhancements

1. **SMS OTP**: Add SMS-based OTP as alternative
2. **Rate Limiting**: Implement API rate limiting
3. **Audit Logging**: Log password reset attempts
4. **Multiple OTP Methods**: Email + SMS verification
5. **Security Questions**: Additional verification steps 