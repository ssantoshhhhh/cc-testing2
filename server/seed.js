const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Product = require('./models/Product');
const Order = require('./models/Order');
require('dotenv').config({ path: './config.env' });

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/campus_connect')
  .then(() => console.log('MongoDB connected for seeding'))
  .catch(err => console.error('MongoDB connection error:', err));

// Sample products data
const products = [
  {
    name: 'Professional Mini Drafter Set',
    description: 'High-quality mini drafter set perfect for engineering students. Includes all essential drafting tools with precision measurements.',
    category: 'mini-drafter',
    price: 1500,
    pricePerDay: 50,
    totalQuantity: 20,
    availableQuantity: 20,
    images: [
      'https://tse1.mm.bing.net/th?id=OIP.lAF5BT_KEsiPCPx1GMfdCQHaIA&pid=Api&P=0&h=180',
      'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=500'
    ],
    specifications: {
      'Material': 'Stainless Steel',
      'Size': 'Standard A4',
      'Includes': 'Ruler, Protractor, Compass, Set Square'
    },
    condition: 'new'
  },
  {
    name: 'Basic Mini Drafter',
    description: 'Essential mini drafter for basic drafting needs. Lightweight and easy to use for beginners.',
    category: 'mini-drafter',
    price: 800,
    pricePerDay: 30,
    totalQuantity: 15,
    availableQuantity: 15,
    images: [
      'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=500'
    ],
    specifications: {
      'Material': 'Plastic & Metal',
      'Size': 'Compact',
      'Includes': 'Basic Ruler, Protractor'
    },
    condition: 'good'
  },
  {
    name: 'Lab Safety Apron - Cotton',
    description: 'Comfortable cotton lab apron for laboratory work. Provides protection against spills and chemicals.',
    category: 'lab-apron',
    price: 200,
    pricePerDay: 10,
    totalQuantity: 50,
    availableQuantity: 50,
    images: [
      'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=500'
    ],
    specifications: {
      'Material': '100% Cotton',
      'Size': 'One Size Fits All',
      'Color': 'White',
      'Features': 'Adjustable straps, Multiple pockets'
    },
    condition: 'new'
  },
  {
    name: 'Lab Safety Apron - Chemical Resistant',
    description: 'Heavy-duty chemical resistant lab apron for advanced laboratory work. Provides maximum protection.',
    category: 'lab-apron',
    price: 400,
    pricePerDay: 20,
    totalQuantity: 25,
    availableQuantity: 25,
    images: [
      'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=500'
    ],
    specifications: {
      'Material': 'PVC Coated',
      'Size': 'Large',
      'Color': 'Blue',
      'Features': 'Chemical resistant, Heavy duty, Long length'
    },
    condition: 'new'
  },
  {
    name: 'Premium Mini Drafter Kit',
    description: 'Professional grade mini drafter kit with additional tools. Perfect for advanced engineering projects.',
    category: 'mini-drafter',
    price: 2500,
    pricePerDay: 75,
    totalQuantity: 10,
    availableQuantity: 10,
    images: [
      'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=500'
    ],
    specifications: {
      'Material': 'Premium Steel',
      'Size': 'Professional',
      'Includes': 'Complete drafting set, Case, Cleaning cloth'
    },
    condition: 'new'
  }
];

// Admin user data
const adminUser = {
  name: 'Admin User',
  email: 'admin@campusconnect.com',
  password: 'admin123',
  role: 'admin',
  studentId: 'ADMIN001',
  phone: '1234567890',
  department: 'Administration'
};

// Seed function
const seedDatabase = async () => {
  try {
    // Clear existing data
    await User.deleteMany({});
    await Product.deleteMany({});
    
    console.log('Cleared existing data');

    // Create admin user
    const admin = await User.create(adminUser);
    
    console.log('Admin user created:', admin.email);

    // Create products
    const createdProducts = await Product.create(products);
    
    console.log(`${createdProducts.length} products created`);

    // Create a sample regular user
    const sampleUser = await User.create({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      role: 'user',
      studentId: 'STU001',
      phone: '9876543210',
      department: 'Computer Science'
    });

    console.log('Sample user created:', sampleUser.email);

    // Create sample orders for the sample user
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

    // Create sample orders
    for (let i = 0; i < sampleOrders.length; i++) {
      const orderData = sampleOrders[i];
      
      // Select random products for each order
      const selectedProducts = [];
      const numProducts = Math.floor(Math.random() * 2) + 1;
      
      for (let j = 0; j < numProducts; j++) {
        const product = createdProducts[Math.floor(Math.random() * createdProducts.length)];
        selectedProducts.push({
          product: product._id,
          quantity: Math.floor(Math.random() * 2) + 1,
          pricePerDay: product.pricePerDay,
          totalPrice: product.pricePerDay * orderData.rentalDays
        });
      }

      await Order.create({
        user: sampleUser._id,
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
    }

    console.log('Sample orders created for demo user');

    console.log('Database seeded successfully!');
    console.log('\nAdmin Login:');
    console.log('Email: admin@campusconnect.com');
    console.log('Password: admin123');
    console.log('\nSample User Login:');
    console.log('Email: john@example.com');
    console.log('Password: password123');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

// Run seed
seedDatabase(); 