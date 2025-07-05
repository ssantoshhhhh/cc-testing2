const mongoose = require('mongoose');
const User = require('./models/User');
const Product = require('./models/Product');
const Order = require('./models/Order');
require('dotenv').config({ path: './config.env' });

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/campus_connect')
  .then(async () => {
    console.log('=== TESTING PUBLIC STATS ENDPOINT ===\n');
    
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

      console.log('=== PUBLIC STATISTICS ===');
      console.log(`Total Users: ${totalUsers}`);
      console.log(`Total Products: ${totalProducts}`);
      console.log(`Total Orders (excluding cancelled): ${totalOrders}`);
      console.log(`Active Rentals: ${activeRentals}`);
      console.log(`Total Revenue: ₹${revenueStats[0]?.totalRevenue || 0}`);
      console.log(`Total Items: ${inventoryStats[0]?.totalItems || 0}`);
      console.log(`Available Items: ${inventoryStats[0]?.availableItems || 0}`);
      
      console.log('\n=== API RESPONSE FORMAT ===');
      console.log({
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
      console.error('Error:', error);
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  }); 