require('dotenv').config({ path: './config.env' });
const mongoose = require('mongoose');

async function printOrdersForJohn() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected for testing');

    const User = require('./models/User');
    const user = await User.findOne({ email: 'john@example.com' });
    if (!user) {
      console.log('User john@example.com not found');
      return;
    }
    console.log('User:', user.name, user.email, user._id);

    const Order = require('./models/Order');
    const orders = await Order.find({ user: user._id });
    console.log(`Total orders for john@example.com: ${orders.length}`);
    orders.forEach((order, idx) => {
      console.log(`${idx + 1}. Status: ${order.status}, Total: ₹${order.totalAmount}, Created: ${order.createdAt}`);
    });
    if (orders.length > 0) {
      console.log('Sample order:', orders[0]);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

printOrdersForJohn(); 