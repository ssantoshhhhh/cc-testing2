const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { uploadProfilePicture, handleUploadError } = require('../middleware/upload');

const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json({
      success: true,
      data: {
        ...user.toObject(),
        hasProfilePicture: !!user.profilePicture?.data
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', [
  protect,
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('email').optional().isEmail().withMessage('Please provide a valid email'),
  body('phone').optional().notEmpty().withMessage('Phone cannot be empty'),
  body('address').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const { name, email, phone, address } = req.body;
    const updateFields = {};
    
    if (name) updateFields.name = name;
    if (email) updateFields.email = email;
    if (phone) updateFields.phone = phone;
    if (address !== undefined) updateFields.address = address;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateFields,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      ...user.toObject(),
      hasProfilePicture: !!user.profilePicture?.data
    });
  } catch (error) {
    console.error('Profile update error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/users/upload-profile-picture
// @desc    Upload profile picture
// @access  Private
router.post('/upload-profile-picture', [
  protect,
  uploadProfilePicture,
  handleUploadError
], async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please select a file to upload' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update user's profile picture
    user.profilePicture = {
      data: req.file.buffer,
      contentType: req.file.mimetype
    };

    await user.save();

    res.json({
      success: true,
      message: 'Profile picture uploaded successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentId: user.studentId,
        department: user.department,
        phone: user.phone,
        address: user.address,
        hasProfilePicture: !!user.profilePicture.data,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Profile picture upload error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/profile-picture/:userId
// @desc    Get user's profile picture
// @access  Public
router.get('/profile-picture/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('profilePicture');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.profilePicture.data) {
      return res.status(404).json({ message: 'Profile picture not found' });
    }

    res.set('Content-Type', user.profilePicture.contentType);
    res.send(user.profilePicture.data);
  } catch (error) {
    console.error('Profile picture retrieval error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/users/profile-picture
// @desc    Delete user's profile picture
// @access  Private
router.delete('/profile-picture', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Remove profile picture
    user.profilePicture = {
      data: null,
      contentType: null
    };

    await user.save();

    res.json({
      success: true,
      message: 'Profile picture deleted successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentId: user.studentId,
        department: user.department,
        phone: user.phone,
        address: user.address,
        hasProfilePicture: false,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Profile picture deletion error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/marketplace-stats
// @desc    Get marketplace statistics for the logged-in user
// @access  Private
router.get('/marketplace-stats', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const Product = require('../models/Product');
    const Transaction = require('../models/Transaction');

    // Total listings by user
    const totalListings = await Product.countDocuments({ seller: userId });
    // Active listings (not sold, available quantity > 0)
    const activeListings = await Product.countDocuments({ seller: userId, isActive: true, availableQuantity: { $gt: 0 } });
    // Total sales (products sold by user)
    const totalSales = await Transaction.countDocuments({ seller: userId });
    // Total purchases (products bought by user)
    const totalPurchases = await Transaction.countDocuments({ buyer: userId });
    // Seller rating (average of all ratings for this seller)
    const user = await User.findById(userId);
    const sellerRating = user?.sellerRating || 0;
    // Total transactions (as buyer or seller)
    const totalTransactions = await Transaction.countDocuments({ $or: [{ seller: userId }, { buyer: userId }] });

    res.json({
      success: true,
      data: {
        totalListings,
        activeListings,
        totalSales,
        totalPurchases,
        sellerRating,
        totalTransactions
      }
    });
  } catch (error) {
    console.error('Error in /marketplace-stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 