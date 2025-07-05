const mongoose = require('mongoose');
const Order = require('./models/Order');
const User = require('./models/User');
const Product = require('./models/Product');
require('dotenv').config({ path: './config.env' });

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/campus_connect')
  .then(async () => {
    console.log('=== TESTING ADMIN DASHBOARD API LOGIC ===\n');
    
    // Simulate the admin dashboard logic
    try {
      // Get total users
      const totalUsers = await User.countDocuments({ role: 'user' });
      
      // Get total products
      const totalProducts = await Product.countDocuments({ isActive: true });
      
      // Get total orders (excluding cancelled/rejected orders)
      const totalOrders = await Order.countDocuments({ status: { $ne: 'cancelled' } });
      
      // Get cancelled orders count
      const cancelledOrders = await Order.countDocuments({ status: 'cancelled' });
      
      // Get revenue statistics (excluding cancelled/rejected orders)
      const revenueStats = await Order.aggregate([
        {
          $match: {
            status: { $ne: 'cancelled' } // Exclude cancelled orders from all statistics
          }
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$totalAmount' },
            totalPenalty: { $sum: '$penaltyAmount' },
            pendingOrders: {
              $sum: {
                $cond: [{ $eq: ['$status', 'pending'] }, 1, 0]
              }
            },
            activeRentals: {
              $sum: {
                $cond: [
                  { $in: ['$status', ['confirmed', 'rented']] },
                  1,
                  0
                ]
              }
            },
            overdueRentals: {
              $sum: {
                $cond: [
                  { $and: [
                    { $in: ['$status', ['confirmed', 'rented']] },
                    { $gt: [new Date(), '$expectedReturnDate'] }
                  ]},
                  1,
                  0
                ]
              }
            }
          }
        }
      ]);

      // Get recent orders (including cancelled orders so admin can see all transactions)
      const recentOrders = await Order.find()
        .populate('user', 'name email studentId')
        .populate('items.product')
        .sort({ createdAt: -1 })
        .limit(10);

      console.log('=== ADMIN DASHBOARD STATISTICS ===');
      console.log(`Total Users: ${totalUsers}`);
      console.log(`Total Products: ${totalProducts}`);
      console.log(`Total Orders (excluding cancelled): ${totalOrders}`);
      console.log(`Cancelled Orders: ${cancelledOrders}`);
      
      if (revenueStats[0]) {
        console.log(`Total Revenue (excluding cancelled): ₹${revenueStats[0].totalRevenue}`);
        console.log(`Total Penalty: ₹${revenueStats[0].totalPenalty}`);
        console.log(`Pending Orders: ${revenueStats[0].pendingOrders}`);
        console.log(`Active Rentals: ${revenueStats[0].activeRentals}`);
        console.log(`Overdue Rentals: ${revenueStats[0].overdueRentals}`);
      } else {
        console.log('No revenue statistics available');
      }
      
      console.log(`\nRecent Orders (including cancelled): ${recentOrders.length}`);
      recentOrders.forEach((order, index) => {
        console.log(`${index + 1}. Order ID: ${order._id.toString().slice(-8)}`);
        console.log(`   User: ${order.user?.name || 'Unknown'}`);
        console.log(`   Status: ${order.status}`);
        console.log(`   Amount: ₹${order.totalAmount}`);
        console.log('');
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