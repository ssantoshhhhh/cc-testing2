const mongoose = require('mongoose');
const Order = require('./models/Order');
const User = require('./models/User');
require('dotenv').config({ path: './config.env' });

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/campus_connect')
  .then(async () => {
    console.log('=== TESTING CANCELLED ORDERS EXCLUSION ===\n');
    
    // Get all orders with their status
    const allOrders = await Order.find().populate('user', 'name email');
    
    console.log('All orders in database:');
    allOrders.forEach(order => {
      console.log(`- Order ID: ${order._id.toString().slice(-8)}`);
      console.log(`  User: ${order.user?.name || 'Unknown'}`);
      console.log(`  Status: ${order.status}`);
      console.log(`  Amount: ₹${order.totalAmount}`);
      console.log('');
    });
    
    // Calculate statistics including cancelled orders
    const statsWithCancelled = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' },
          totalPenalty: { $sum: '$penaltyAmount' },
          pendingOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          activeRentals: {
            $sum: {
              $cond: [{ $in: ['$status', ['confirmed', 'rented']] }, 1, 0]
            }
          },
          cancelledOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
          }
        }
      }
    ]);
    
    // Calculate statistics excluding cancelled orders
    const statsWithoutCancelled = await Order.aggregate([
      {
        $match: { status: { $ne: 'cancelled' } }
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' },
          totalPenalty: { $sum: '$penaltyAmount' },
          pendingOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          activeRentals: {
            $sum: {
              $cond: [{ $in: ['$status', ['confirmed', 'rented']] }, 1, 0]
            }
          }
        }
      }
    ]);
    
    console.log('=== STATISTICS COMPARISON ===');
    console.log('\nIncluding cancelled orders:');
    console.log(statsWithCancelled[0] || 'No data');
    
    console.log('\nExcluding cancelled orders:');
    console.log(statsWithoutCancelled[0] || 'No data');
    
    console.log('\n=== SUMMARY ===');
    console.log(`Total orders in database: ${allOrders.length}`);
    console.log(`Orders with cancelled status: ${allOrders.filter(o => o.status === 'cancelled').length}`);
    console.log(`Orders excluding cancelled: ${statsWithoutCancelled[0]?.totalOrders || 0}`);
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  }); 