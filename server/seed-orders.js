const mongoose = require('mongoose');
const User = require('./models/User');
const Product = require('./models/Product');
const Order = require('./models/Order');
require('dotenv').config({ path: './config.env' });

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/campus_connect')
  .then(() => console.log('MongoDB connected for seeding orders'))
  .catch(err => console.error('MongoDB connection error:', err));

const sampleOrders = [
  {
    rentalDays: 7,
    totalAmount: 350,
    status: 'returned',
    paymentStatus: 'paid',
    penaltyAmount: 0,
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    expectedReturnDate: new Date(Date.now() - 23 * 24 * 60 * 60 * 1000),
    actualReturnDate: new Date(Date.now() - 23 * 24 * 60 * 60 * 1000),
    notes: 'Order completed successfully'
  },
  {
    rentalDays: 14,
    totalAmount: 700,
    status: 'rented',
    paymentStatus: 'paid',
    penaltyAmount: 0,
    startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    expectedReturnDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000),
    notes: 'Currently active rental'
  },
  {
    rentalDays: 3,
    totalAmount: 150,
    status: 'rented',
    paymentStatus: 'paid',
    penaltyAmount: 50,
    startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    expectedReturnDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    notes: 'Overdue rental'
  },
  {
    rentalDays: 5,
    totalAmount: 250,
    status: 'pending',
    paymentStatus: 'pending',
    penaltyAmount: 0,
    startDate: new Date(),
    expectedReturnDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    notes: 'Pending confirmation'
  },
  {
    rentalDays: 10,
    totalAmount: 500,
    status: 'returned',
    paymentStatus: 'paid',
    penaltyAmount: 25,
    startDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
    expectedReturnDate: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000),
    actualReturnDate: new Date(Date.now() - 34 * 24 * 60 * 60 * 1000),
    notes: 'Returned with minor delay'
  }
];

const seedOrders = async () => {
  try {
    const users = await User.find({ role: 'user' });
    const products = await Product.find();
    
    if (users.length === 0) {
      console.log('No users found. Please run the main seed script first.');
      process.exit(1);
    }
    
    if (products.length === 0) {
      console.log('No products found. Please run the main seed script first.');
      process.exit(1);
    }

    await Order.deleteMany({});
    console.log('Cleared existing orders');

    const createdOrders = [];

    for (const user of users) {
      for (let i = 0; i < sampleOrders.length; i++) {
        const orderData = sampleOrders[i];
        
        const selectedProducts = [];
        const numProducts = Math.floor(Math.random() * 2) + 1;
        
        for (let j = 0; j < numProducts; j++) {
          const product = products[Math.floor(Math.random() * products.length)];
          selectedProducts.push({
            product: product._id,
            quantity: Math.floor(Math.random() * 2) + 1,
            pricePerDay: product.pricePerDay,
            totalPrice: product.pricePerDay * orderData.rentalDays
          });
        }

        const order = await Order.create({
          user: user._id,
          items: selectedProducts,
          rentalDays: orderData.rentalDays,
          totalAmount: orderData.totalAmount,
          status: orderData.status,
          paymentStatus: orderData.paymentStatus,
          penaltyAmount: orderData.penaltyAmount,
          startDate: orderData.startDate,
          expectedReturnDate: orderData.expectedReturnDate,
          actualReturnDate: orderData.actualReturnDate,
          notes: orderData.notes
        });

        createdOrders.push(order);
        console.log(`Created order ${i + 1} for user ${user.name}`);
      }
    }

    console.log(`\nSuccessfully created ${createdOrders.length} sample orders!`);
    console.log('\nOrder Statistics:');
    console.log(`Total Orders: ${createdOrders.length}`);
    console.log(`Active Rentals: ${createdOrders.filter(o => ['confirmed', 'rented'].includes(o.status)).length}`);
    console.log(`Overdue Rentals: ${createdOrders.filter(o => o.isOverdue).length}`);
    console.log(`Total Spent: ₹${createdOrders.reduce((sum, o) => sum + o.totalAmount, 0)}`);
    console.log(`Total Penalties: ₹${createdOrders.reduce((sum, o) => sum + o.penaltyAmount, 0)}`);

    process.exit(0);
  } catch (error) {
    console.error('Error seeding orders:', error);
    process.exit(1);
  }
};

seedOrders(); 