const mongoose = require('mongoose');
const Order = require('./models/Order');
const User = require('./models/User');
require('dotenv').config({ path: './config.env' });

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/campus_connect')
  .then(async () => {
    console.log('=== CHECKING ORDERS WITH INVALID USER REFERENCES ===\n');

    // Find all orders and populate user
    const orders = await Order.find().populate('user', 'name email');
    const invalidOrders = orders.filter(order => !order.user);

    if (invalidOrders.length === 0) {
      console.log('No orders with missing/invalid user references found.');
    } else {
      console.log(`Found ${invalidOrders.length} orders with missing/invalid user references:`);
      invalidOrders.forEach(order => {
        console.log(`- Order ID: ${order._id}, Status: ${order.status}, Expected Return: ${order.expectedReturnDate}`);
      });

      // Remove these orders
      const ids = invalidOrders.map(order => order._id);
      await Order.deleteMany({ _id: { $in: ids } });
      console.log(`\nRemoved ${ids.length} orders with missing/invalid user references.`);
    }

    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  }); 