# Account Deletion Implementation

## Overview

This document describes the implementation of account deletion functionality for users with OTP verification and email notifications for both user-initiated and admin-initiated deletions.

## Features Implemented

### 1. User-Initiated Account Deletion
- **OTP Verification**: Users must enter a 6-digit OTP sent to their email
- **Active Order Check**: Users cannot delete accounts with active rentals
- **Two-Step Process**: Confirmation → OTP verification → Account deletion
- **Session Cleanup**: Automatic logout after successful deletion

### 2. Admin-Initiated Account Deletion
- **Email Notification**: Users receive email notification when admin deletes their account
- **Active Order Check**: Admins cannot delete users with active rentals
- **Complete Data Removal**: All user data and orders are permanently deleted

### 3. Security Features
- **OTP Expiration**: 10-minute validity period
- **Active Order Protection**: Prevents deletion of accounts with active rentals
- **Session Management**: Proper session cleanup after deletion
- **Email Verification**: OTP sent to registered email address

## Backend Implementation

### Database Schema Updates

#### User Model Changes:
```javascript
// Added to User schema
deleteAccountOTP: String,           // Stores the OTP code
deleteAccountOTPExpire: Date,       // OTP expiration timestamp
```

### API Endpoints

#### New Endpoints Added:
- `POST /api/auth/send-delete-account-otp` - Send OTP for account deletion
- `POST /api/auth/verify-delete-account-otp` - Verify OTP and delete account
- `POST /api/auth/resend-delete-account-otp` - Resend OTP if needed

#### Modified Endpoints:
- `DELETE /api/admin/users/:id` - Now sends email notification before deletion

### Email Templates

#### Account Deletion OTP Email:
- **Subject**: "Account Deletion OTP - Campus Connect"
- **Content**: Professional HTML email with:
  - User's name
  - 6-digit OTP prominently displayed
  - Warning about irreversible action
  - 10-minute validity notice
  - Security instructions

#### Admin Deletion Notification Email:
- **Subject**: "Account Deleted - Campus Connect"
- **Content**: Notification email with:
  - Account deletion confirmation
  - Account details (name, email, student ID, department)
  - Explanation of what was deleted
  - Contact information for questions

## Frontend Implementation

### Profile Page Updates

#### New UI Components:
1. **Danger Zone Section**: Red-themed section with delete account button
2. **Delete Account Modal**: Two-step modal with confirmation and OTP verification
3. **OTP Input**: Real-time validation and formatting
4. **Resend Functionality**: 60-second countdown timer

#### Features:
- Real-time OTP input validation
- Loading states during API calls
- Error handling and user feedback
- Responsive design for mobile devices
- Clear warning messages about irreversible action

### AuthContext Updates

#### New Functions Added:
```javascript
sendDeleteAccountOTP()      // Send OTP for account deletion
verifyDeleteAccountOTP(otp) // Verify OTP and delete account
resendDeleteAccountOTP()    // Resend OTP if needed
```

## User Flow

### User-Initiated Deletion:
1. **Profile Page**: User clicks "Delete Account" button
2. **Confirmation Modal**: User confirms deletion intention
3. **OTP Request**: System sends OTP to user's email
4. **OTP Verification**: User enters 6-digit OTP
5. **Account Deletion**: System deletes account and logs out user
6. **Redirect**: User is redirected to home page

### Admin-Initiated Deletion:
1. **Admin Dashboard**: Admin selects user to delete
2. **Validation**: System checks for active orders
3. **Email Notification**: System sends notification email to user
4. **Account Deletion**: System deletes user account and all data
5. **Confirmation**: Admin receives success confirmation

## Security Considerations

### 1. OTP Security
- **6-digit numeric OTP**: Provides good security
- **10-minute expiration**: Prevents brute force attacks
- **One-time use**: OTP is cleared after verification
- **Email delivery**: Ensures user has access to email

### 2. Active Order Protection
- **Rental Check**: Prevents deletion of accounts with active rentals
- **Data Integrity**: Ensures no orphaned orders exist
- **User Experience**: Clear error messages explain why deletion is blocked

### 3. Session Management
- **Automatic Logout**: User is logged out after successful deletion
- **Session Cleanup**: Proper session destruction
- **Cookie Removal**: Clears authentication cookies

### 4. Email Notifications
- **Admin Deletion**: Users are notified when admin deletes their account
- **Account Details**: Email includes account information for reference
- **Contact Information**: Provides support contact for questions

## Error Handling

### Common Error Scenarios:
1. **Active Orders**: User has confirmed or rented orders
2. **Invalid OTP**: User enters wrong 6-digit code
3. **Expired OTP**: OTP has passed 10-minute limit
4. **Email Failure**: SMTP server issues
5. **Network Issues**: Connection problems

### User Feedback:
- Clear error messages
- Toast notifications
- Loading states
- Retry mechanisms

## Testing

### Backend Testing:
```bash
node test-account-deletion.js
```

### Frontend Testing:
1. Navigate to Profile page
2. Click "Delete Account" button
3. Confirm deletion in modal
4. Check email for OTP
5. Enter OTP to complete deletion

### Admin Testing:
1. Login as admin
2. Navigate to Users page
3. Select user to delete
4. Verify email notification is sent
5. Confirm account is deleted

## Configuration Requirements

### Environment Variables:
```env
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_app_password
```

### Gmail Setup:
1. Enable 2-factor authentication
2. Generate app password
3. Use app password in EMAIL_PASS

## API Response Examples

### Send Delete Account OTP:
```json
{
  "success": true,
  "message": "OTP sent to your email address"
}
```

### Verify Delete Account OTP:
```json
{
  "success": true,
  "message": "Account deleted successfully"
}
```

### Error Responses:
```json
{
  "message": "Cannot delete account with active orders. Please return all rented items first."
}
```

## Future Enhancements

1. **SMS OTP**: Add SMS-based OTP as alternative
2. **Rate Limiting**: Implement API rate limiting
3. **Audit Logging**: Log account deletion attempts
4. **Data Export**: Allow users to export their data before deletion
5. **Recovery Period**: Add grace period for account recovery

## Troubleshooting

### Common Issues:

1. **Email Not Received**
   - Check spam folder
   - Verify email configuration
   - Check server logs

2. **OTP Verification Fails**
   - Ensure OTP is 6 digits
   - Check if OTP has expired
   - Verify user is logged in

3. **Active Orders Block Deletion**
   - Return all rented items
   - Cancel pending orders
   - Contact admin if needed

4. **Admin Deletion Issues**
   - Check admin permissions
   - Verify user has no active orders
   - Check email configuration

## Deployment Notes

1. **Environment Variables**: Ensure all required env vars are set
2. **Email Configuration**: Test email delivery in production
3. **Database**: Ensure MongoDB is accessible
4. **SSL**: Use HTTPS in production for security
5. **Backup**: Ensure proper backup before testing deletion

## Security Best Practices

1. **Rate Limiting**: Consider adding rate limiting to prevent abuse
2. **OTP Complexity**: Current 6-digit OTP provides good security
3. **Expiration Time**: 10 minutes is a good balance between security and usability
4. **Email Validation**: Always validate email format and existence
5. **Error Messages**: Don't reveal if email exists or not (security through obscurity) 