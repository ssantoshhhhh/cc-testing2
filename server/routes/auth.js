const express = require('express');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
// Remove EmailJS import
const User = require('../models/User');
const Product = require('../models/Product');
const BuyRequest = require('../models/BuyRequest');
const Transaction = require('../models/Transaction');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// Send welcome email using Nodemailer
const sendWelcomeEmailNodemailer = async (userEmail, userName) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: userEmail,
    subject: 'Welcome to Campus Connect!',
    text: `Hello ${userName},\n\nWelcome to Campus Connect! We are excited to have you on board.\n\nIf you have any questions, feel free to reply to this email.\n\nBest regards,\nCampus Connect Team`
  };

  await transporter.sendMail(mailOptions);
};

// Send registration OTP email
const sendRegistrationOTP = async (userEmail, userName, otp) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: userEmail,
    subject: 'Email Verification OTP - Campus Connect',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Email Verification</h2>
        <p>Hello ${userName},</p>
        <p>Thank you for registering with Campus Connect! Please use the following OTP to verify your email address:</p>
        <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
          <h1 style="color: #28a745; font-size: 32px; margin: 0; letter-spacing: 5px;">${otp}</h1>
        </div>
        <p><strong>Important:</strong></p>
        <ul>
          <li>This OTP is valid for 10 minutes only</li>
          <li>Do not share this OTP with anyone</li>
          <li>If you didn't register for this account, please ignore this email</li>
        </ul>
        <p>Best regards,<br>Campus Connect Team</p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};

// Send account deletion OTP email
const sendAccountDeletionOTP = async (userEmail, userName, otp) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: userEmail,
    subject: 'Account Deletion OTP - Campus Connect',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Account Deletion Request</h2>
        <p>Hello ${userName},</p>
        <p>You have requested to delete your account. Please use the following OTP to confirm the deletion:</p>
        <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
          <h1 style="color: #dc3545; font-size: 32px; margin: 0; letter-spacing: 5px;">${otp}</h1>
        </div>
        <p><strong>⚠️ Warning:</strong></p>
        <ul>
          <li>This action is irreversible</li>
          <li>All your data will be permanently deleted</li>
          <li>This OTP is valid for 10 minutes only</li>
          <li>Do not share this OTP with anyone</li>
          <li>If you didn't request this, please ignore this email</li>
        </ul>
        <p>Best regards,<br>Campus Connect Team</p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};

// @route   POST /api/auth/send-registration-otp
// @desc    Send OTP for registration
// @access  Public
router.post('/send-registration-otp', [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('studentId').notEmpty().withMessage('Student ID is required'),
  body('phone').notEmpty().withMessage('Phone number is required'),
  body('department').notEmpty().withMessage('Department is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, studentId, phone, department } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { studentId }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email or student ID' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Create temporary user with OTP
    const tempUser = new User({
      name,
      email,
      password,
      studentId,
      phone,
      department,
      registrationOTP: otp,
      registrationOTPExpire: Date.now() + 10 * 60 * 1000, // 10 minutes
      isEmailVerified: false
    });

    await tempUser.save();

    // Send OTP via email
    try {
      await sendRegistrationOTP(email, name, otp);
      res.json({ 
        success: true,
        message: 'OTP sent to your email address',
        email: email
      });
    } catch (emailError) {
      // If email fails, delete the temporary user
      await User.findByIdAndDelete(tempUser._id);
      console.error('Failed to send registration OTP:', emailError);
      res.status(500).json({ message: 'Failed to send OTP. Please try again.' });
    }
  } catch (error) {
    console.error('Send registration OTP error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/verify-registration-otp
// @desc    Verify OTP and complete registration
// @access  Public
router.post('/verify-registration-otp', [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, otp } = req.body;

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if OTP exists and is valid
    if (!user.registrationOTP || user.registrationOTP !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // Check if OTP is expired
    if (user.registrationOTPExpire < Date.now()) {
      return res.status(400).json({ message: 'OTP has expired' });
    }

    // Mark user as verified and clear OTP
    user.isEmailVerified = true;
    user.registrationOTP = undefined;
    user.registrationOTPExpire = undefined;
    await user.save();

    // Send welcome email
    try {
      await sendWelcomeEmailNodemailer(user.email, user.name);
      console.log('Welcome email sent to:', user.email);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail the registration if welcome email fails
    }

    // Set session
    req.session.userId = user._id;
    res.status(201).json({
      success: true,
      message: 'Registration completed successfully!',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentId: user.studentId,
        department: user.department,
        phone: user.phone,
        address: user.address,
        hasProfilePicture: !!user.profilePicture?.data,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Verify registration OTP error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/resend-registration-otp
// @desc    Resend registration OTP
// @access  Public
router.post('/resend-registration-otp', [
  body('email').isEmail().withMessage('Please enter a valid email')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user is already verified
    if (user.isEmailVerified) {
      return res.status(400).json({ message: 'User is already verified' });
    }

    // Generate new 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.registrationOTP = otp;
    user.registrationOTPExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

    await user.save();

    // Send new OTP via email
    try {
      await sendRegistrationOTP(email, user.name, otp);
      res.json({ 
        success: true,
        message: 'New OTP sent to your email address' 
      });
    } catch (emailError) {
      console.error('Failed to send new registration OTP:', emailError);
      res.status(500).json({ message: 'Failed to send OTP. Please try again.' });
    }
  } catch (error) {
    console.error('Resend registration OTP error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/register
// @desc    Register user (legacy endpoint - now redirects to OTP flow)
// @access  Public
router.post('/register', [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('studentId').notEmpty().withMessage('Student ID is required'),
  body('phone').notEmpty().withMessage('Phone number is required'),
  body('department').notEmpty().withMessage('Department is required')
], async (req, res) => {
  // Redirect to OTP flow
  return res.status(400).json({ 
    message: 'Please use the new registration flow with OTP verification',
    requiresOTP: true
  });
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    console.log('Login attempt for email:', email);

    // Check if user exists
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      console.log('User not found for email:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    console.log('User found:', user.name, 'Role:', user.role);
    console.log('Entered password:', password);
    console.log('Stored hash:', user.password);

    // Check if password matches
    const isMatch = await user.comparePassword(password);
    console.log('Password match:', isMatch);
    
    if (!isMatch) {
      console.log('Password does not match for user:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    // Generate JWT token
    const token = generateToken(user._id);
    
    // Set session
    req.session.userId = user._id;
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentId: user.studentId,
        department: user.department,
        phone: user.phone,
        address: user.address,
        hasProfilePicture: !!user.profilePicture?.data,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Send OTP for password reset
// @access  Public
router.post('/forgot-password', [
  body('email').isEmail().withMessage('Please enter a valid email')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordOTP = otp;
    user.resetPasswordOTPExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

    await user.save();

    // Send OTP via email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset OTP - Campus Connect',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>Hello ${user.name},</p>
          <p>You have requested to reset your password. Please use the following OTP to proceed:</p>
          <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #007bff; font-size: 32px; margin: 0; letter-spacing: 5px;">${otp}</h1>
          </div>
          <p><strong>Important:</strong></p>
          <ul>
            <li>This OTP is valid for 10 minutes only</li>
            <li>Do not share this OTP with anyone</li>
            <li>If you didn't request this, please ignore this email</li>
          </ul>
          <p>Best regards,<br>Campus Connect Team</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    res.json({ 
      success: true,
      message: 'OTP sent to your email address' 
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Email could not be sent' });
  }
});

// @route   POST /api/auth/verify-otp
// @desc    Verify OTP and reset password
// @access  Public
router.post('/verify-otp', [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, otp, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if OTP exists and is valid
    if (!user.resetPasswordOTP || user.resetPasswordOTP !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // Check if OTP is expired
    if (user.resetPasswordOTPExpire < Date.now()) {
      return res.status(400).json({ message: 'OTP has expired' });
    }

    // Update password
    user.password = password;
    user.resetPasswordOTP = undefined;
    user.resetPasswordOTPExpire = undefined;
    await user.save();

    // Send confirmation email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset Successful - Campus Connect',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Reset Successful</h2>
          <p>Hello ${user.name},</p>
          <p>Your password has been successfully reset.</p>
          <p>If you did not perform this action, please contact us immediately.</p>
          <p>Best regards,<br>Campus Connect Team</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    res.json({
      success: true,
      message: 'Password reset successful'
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/resend-otp
// @desc    Resend OTP for password reset
// @access  Public
router.post('/resend-otp', [
  body('email').isEmail().withMessage('Please enter a valid email')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate new 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordOTP = otp;
    user.resetPasswordOTPExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

    await user.save();

    // Send new OTP via email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'New Password Reset OTP - Campus Connect',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">New Password Reset OTP</h2>
          <p>Hello ${user.name},</p>
          <p>You have requested a new OTP for password reset. Please use the following OTP:</p>
          <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #007bff; font-size: 32px; margin: 0; letter-spacing: 5px;">${otp}</h1>
          </div>
          <p><strong>Important:</strong></p>
          <ul>
            <li>This OTP is valid for 10 minutes only</li>
            <li>Do not share this OTP with anyone</li>
            <li>If you didn't request this, please ignore this email</li>
          </ul>
          <p>Best regards,<br>Campus Connect Team</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    res.json({ 
      success: true,
      message: 'New OTP sent to your email address' 
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ message: 'Email could not be sent' });
  }
});

// @route   POST /api/auth/send-delete-account-otp
// @desc    Send OTP for account deletion
// @access  Private
router.post('/send-delete-account-otp', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user has any active listings
    const activeListings = await Product.find({
      seller: req.user.id,
      availableQuantity: { $gt: 0 }
    });

    if (activeListings.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete account with active listings. Please remove all your listings first.' 
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.deleteAccountOTP = otp;
    user.deleteAccountOTPExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

    await user.save();

    // Send OTP via email
    try {
      await sendAccountDeletionOTP(user.email, user.name, otp);
      res.json({ 
        success: true,
        message: 'OTP sent to your email address'
      });
    } catch (emailError) {
      // If email fails, clear the OTP
      user.deleteAccountOTP = undefined;
      user.deleteAccountOTPExpire = undefined;
      await user.save();
      console.error('Failed to send account deletion OTP:', emailError);
      res.status(500).json({ message: 'Failed to send OTP. Please try again.' });
    }
  } catch (error) {
    console.error('Send account deletion OTP error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/verify-delete-account-otp
// @desc    Verify OTP and delete account
// @access  Private
router.post('/verify-delete-account-otp', [
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
], protect, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { otp } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if OTP exists and is valid
    if (!user.deleteAccountOTP || user.deleteAccountOTP !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // Check if OTP is expired
    if (user.deleteAccountOTPExpire < Date.now()) {
      return res.status(400).json({ message: 'OTP has expired' });
    }

    // Check if user has any active buy requests
    const activeBuyRequests = await BuyRequest.find({
      $or: [
        { buyer: req.user.id, status: { $in: ['pending', 'accepted'] } },
        { seller: req.user.id, status: { $in: ['pending', 'accepted'] } }
      ]
    });

    if (activeBuyRequests.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete account with active buy requests. Please complete or cancel all pending requests first.' 
      });
    }

    // Check if user has any active transactions
    const activeTransactions = await Transaction.find({
      $or: [
        { buyer: req.user.id, status: { $in: ['pending', 'completed'] } },
        { seller: req.user.id, status: { $in: ['pending', 'completed'] } }
      ]
    });

    if (activeTransactions.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete account with active transactions. Please complete all pending transactions first.' 
      });
    }

    // Delete the user
    await User.findByIdAndDelete(req.user.id);

    // Destroy session
    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      res.json({
        success: true,
        message: 'Account deleted successfully'
      });
    });
  } catch (error) {
    console.error('Verify account deletion OTP error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/resend-delete-account-otp
// @desc    Resend account deletion OTP
// @access  Private
router.post('/resend-delete-account-otp', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user has any active listings
    const activeListings = await Product.find({
      seller: req.user.id,
      availableQuantity: { $gt: 0 }
    });

    if (activeListings.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete account with active listings. Please remove all your listings first.' 
      });
    }

    // Generate new 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.deleteAccountOTP = otp;
    user.deleteAccountOTPExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

    await user.save();

    // Send new OTP via email
    try {
      await sendAccountDeletionOTP(user.email, user.name, otp);
      res.json({ 
        success: true,
        message: 'New OTP sent to your email address' 
      });
    } catch (emailError) {
      console.error('Failed to send new account deletion OTP:', emailError);
      res.status(500).json({ message: 'Failed to send OTP. Please try again.' });
    }
  } catch (error) {
    console.error('Resend account deletion OTP error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Public
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.json({ success: true, message: 'Logged out successfully' });
  });
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentId: user.studentId,
        department: user.department,
        phone: user.phone,
        address: user.address,
        hasProfilePicture: !!user.profilePicture?.data,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Error in /api/auth/me:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 