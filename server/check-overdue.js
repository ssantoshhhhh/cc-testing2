const mongoose = require('mongoose');
const Order = require('./models/Order');
const User = require('./models/User');
require('dotenv').config({ path: './config.env' });

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/campus_connect')
  .then(async () => {
    console.log('=== CHECKING OVERDUE ORDERS ===\n');
    
    const today = new Date();
    console.log(`Today's date: ${today.toDateString()}\n`);
    
    // Get all orders with status confirmed or rented
    const activeOrders = await Order.find({
      status: { $in: ['confirmed', 'rented'] }
    }).populate('user', 'name email');
    
    console.log(`Total active orders (confirmed/rented): ${activeOrders.length}\n`);
    
    // Check which ones are overdue
    const overdueOrders = [];
    const notOverdueOrders = [];
    
    activeOrders.forEach(order => {
      const isOverdue = today > order.expectedReturnDate;
      const daysOverdue = isOverdue ? Math.ceil((today - order.expectedReturnDate) / (1000 * 60 * 60 * 24)) : 0;
      
      if (isOverdue) {
        overdueOrders.push({ order, daysOverdue });
      } else {
        notOverdueOrders.push({ order, daysRemaining: Math.ceil((order.expectedReturnDate - today) / (1000 * 60 * 60 * 24)) });
      }
    });
    
    console.log('=== OVERDUE ORDERS ===');
    if (overdueOrders.length === 0) {
      console.log('No overdue orders found!');
    } else {
      overdueOrders.forEach(({ order, daysOverdue }) => {
        const userName = order.user && order.user.name ? order.user.name : 'Unknown';
        const userEmail = order.user && order.user.email ? order.user.email : 'Unknown';
        console.log(`- ${userName} (${userEmail})`);
        console.log(`  Status: ${order.status}`);
        console.log(`  Expected Return: ${order.expectedReturnDate.toDateString()}`);
        console.log(`  Days Overdue: ${daysOverdue}`);
        console.log(`  Amount: ₹${order.totalAmount}`);
        console.log('');
      });
    }
    
    console.log('=== NOT OVERDUE ORDERS ===');
    notOverdueOrders.forEach(({ order, daysRemaining }) => {
      const userName = order.user && order.user.name ? order.user.name : 'Unknown';
      const userEmail = order.user && order.user.email ? order.user.email : 'Unknown';
      console.log(`- ${userName} (${userEmail})`);
      console.log(`  Status: ${order.status}`);
      console.log(`  Expected Return: ${order.expectedReturnDate.toDateString()}`);
      console.log(`  Days Remaining: ${daysRemaining}`);
      console.log(`  Amount: ₹${order.totalAmount}`);
      console.log('');
    });
    
    console.log(`\nSummary:`);
    console.log(`- Total active orders: ${activeOrders.length}`);
    console.log(`- Overdue orders: ${overdueOrders.length}`);
    console.log(`- Not overdue orders: ${notOverdueOrders.length}`);
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  }); 