const express = require('express');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');

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
    
    // Get total orders (excluding cancelled)
    const totalOrders = await Order.countDocuments({ status: { $ne: 'cancelled' } });
    
    // Get active rentals
    const activeRentals = await Order.countDocuments({
      status: { $in: ['confirmed', 'rented'] }
    });
    
    // Get total revenue (excluding cancelled orders)
    const revenueStats = await Order.aggregate([
      {
        $match: {
          status: { $ne: 'cancelled' }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' }
        }
      }
    ]);

    // Get total items available for rent
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

    res.json({
      success: true,
      data: {
        totalUsers,
        totalProducts,
        totalOrders,
        activeRentals,
        totalRevenue: revenueStats[0]?.totalRevenue || 0,
        totalItems: inventoryStats[0]?.totalItems || 0,
        availableItems: inventoryStats[0]?.availableItems || 0
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 