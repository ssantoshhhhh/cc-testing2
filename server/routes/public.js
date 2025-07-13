const express = require('express');
const User = require('../models/User');
const Product = require('../models/Product');
const { sendContactEmail } = require('../utils/emailService');

const router = express.Router();

// @route   GET /api/public/stats
// @desc    Get public statistics (no authentication required)
// @access  Public
router.get('/stats', async (req, res) => {
  try {
    // Get total users (excluding admins)
    const totalUsers = await User.countDocuments({ role: 'user' });
    
    // Get total products
    const totalProducts = await Product.countDocuments({ isActive: true });
    
    // Get active sellers
    const activeSellers = await User.countDocuments({ 
      role: 'user',
      isActive: true,
      isSeller: true
    });
    
    // Get total items available for sale
    const inventoryStats = await Product.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          totalItems: { $sum: '$totalQuantity' },
          availableItems: { $sum: '$availableQuantity' }
        }
      }
    ]);

    // Get total transactions (placeholder for future implementation)
    const totalTransactions = 0;
    const totalRevenue = 0;

    res.json({
      success: true,
      data: {
        totalUsers,
        totalProducts,
        activeSellers,
        totalTransactions,
        totalRevenue,
        totalItems: inventoryStats[0]?.totalItems || 0,
        availableItems: inventoryStats[0]?.availableItems || 0
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/public/contact
// @desc    Receive contact form and send email to admin
// @access  Public
router.post('/contact', async (req, res) => {
  try {
    const { firstName, lastName, email, subject, message } = req.body;
    if (!firstName || !lastName || !email || !subject || !message) {
      return res.status(400).json({ message: 'All fields are required.' });
    }
    await sendContactEmail({ firstName, lastName, email, subject, message });
    res.json({ success: true, message: 'Message sent successfully.' });
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({ message: 'Failed to send message. Please try again later.' });
  }
});

module.exports = router; 