const mongoose = require('mongoose');
const Order = require('./models/Order');
const User = require('./models/User');
const Product = require('./models/Product');
require('dotenv').config({ path: './config.env' });

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/campus_connect')
  .then(async () => {
    console.log('=== TESTING USER DASHBOARD API LOGIC ===\n');
    
    // Get a test user (John Doe)
    const testUser = await User.findOne({ email: 'john@example.com' });
    
    if (!testUser) {
      console.log('Test user not found');
      process.exit(1);
    }
    
    console.log(`Testing for user: ${testUser.name} (${testUser.email})\n`);
    
    // Simulate the user dashboard logic
    try {
      // Get order statistics (excluding cancelled/rejected orders)
      const stats = await Order.aggregate([
        { 
          $match: { 
            user: testUser._id,
            status: { $ne: 'cancelled' } // Exclude cancelled orders from statistics
          } 
        },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalSpent: { $sum: '$totalAmount' },
            totalPenalty: { $sum: '$penaltyAmount' },
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

      // Get recent orders (including cancelled orders so users can see them)
      const recentOrders = await Order.find({ 
        user: testUser._id
      })
        .populate('items.product')
        .sort({ createdAt: -1 })
        .limit(5);

      console.log('=== USER DASHBOARD STATISTICS ===');
      if (stats[0]) {
        console.log(`Total Orders (excluding cancelled): ${stats[0].totalOrders}`);
        console.log(`Total Spent (excluding cancelled): ₹${stats[0].totalSpent}`);
        console.log(`Total Penalty: ₹${stats[0].totalPenalty}`);
        console.log(`Active Rentals: ${stats[0].activeRentals}`);
        console.log(`Overdue Rentals: ${stats[0].overdueRentals}`);
      } else {
        console.log('No statistics available');
      }
      
      console.log(`\nRecent Orders (excluding cancelled): ${recentOrders.length}`);
      recentOrders.forEach((order, index) => {
        console.log(`${index + 1}. Order ID: ${order._id.toString().slice(-8)}`);
        console.log(`   Status: ${order.status}`);
        console.log(`   Amount: ₹${order.totalAmount}`);
        console.log(`   Created: ${order.createdAt.toDateString()}`);
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