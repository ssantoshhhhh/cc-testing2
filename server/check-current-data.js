const mongoose = require('mongoose');
require('dotenv').config({ path: 'config.env' });

// Import models
const User = require('./models/User');
const Order = require('./models/Order');

async function checkCurrentData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Check users
    console.log('👥 USERS DATA:');
    const users = await User.find({}).select('-password');
    console.log(`Total users: ${users.length}`);
    
    users.forEach((user, index) => {
      console.log(`\n${index + 1}. User: ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Student ID: ${user.studentId}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   isActive: ${user.isActive}`);
      console.log(`   Created: ${user.createdAt}`);
    });

    // Check orders
    console.log('\n📦 ORDERS DATA:');
    const orders = await Order.find({}).populate('user', 'name email');
    console.log(`Total orders: ${orders.length}`);
    
    // Group orders by status
    const orderStats = {};
    orders.forEach(order => {
      const status = order.status;
      if (!orderStats[status]) {
        orderStats[status] = [];
      }
      orderStats[status].push(order);
    });

    console.log('\nOrders by status:');
    Object.keys(orderStats).forEach(status => {
      console.log(`   ${status}: ${orderStats[status].length} orders`);
      orderStats[status].forEach(order => {
        console.log(`     - ${order.user?.name || 'Unknown'} (${order.user?.email || 'No email'}) - ${order.createdAt}`);
      });
    });

    // Check specific user orders
    if (users.length > 0) {
      const firstUser = users[0];
      console.log(`\n🔍 ORDERS FOR USER: ${firstUser.name}`);
      const userOrders = await Order.find({ user: firstUser._id });
      console.log(`Total orders for ${firstUser.name}: ${userOrders.length}`);
      
      userOrders.forEach((order, index) => {
        console.log(`   ${index + 1}. Order ID: ${order._id}`);
        console.log(`      Status: ${order.status}`);
        console.log(`      Created: ${order.createdAt}`);
        console.log(`      Total Amount: ${order.totalAmount}`);
      });
    }

    // Test the aggregation queries
    console.log('\n🧮 TESTING AGGREGATION QUERIES:');
    
    const userIds = users.map(u => u._id);
    if (userIds.length > 0) {
      // Test total orders aggregation
      const totalOrdersAgg = await Order.aggregate([
        { $match: { user: { $in: userIds } } },
        { $group: { _id: '$user', totalRentals: { $sum: 1 } } }
      ]);
      console.log('Total orders per user:', totalOrdersAgg);

      // Test successful orders aggregation
      const successfulAgg = await Order.aggregate([
        { $match: { user: { $in: userIds }, status: { $in: ['confirmed', 'rented', 'returned'] } } },
        { $group: { _id: '$user', successfulOrders: { $sum: 1 } } }
      ]);
      console.log('Successful orders per user:', successfulAgg);

      // Test declined orders aggregation
      const declinedAgg = await Order.aggregate([
        { $match: { user: { $in: userIds }, status: 'cancelled' } },
        { $group: { _id: '$user', declinedOrders: { $sum: 1 } } }
      ]);
      console.log('Declined orders per user:', declinedAgg);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

checkCurrentData(); 