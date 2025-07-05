const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Product = require('./models/Product');
const Order = require('./models/Order');
require('dotenv').config({ path: './config.env' });

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/campus_connect')
  .then(() => console.log('MongoDB connected for comprehensive seeding'))
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
    condition: 'new',
    isActive: true
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
    condition: 'good',
    isActive: true
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
    condition: 'new',
    isActive: true
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
    condition: 'new',
    isActive: true
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
    condition: 'new',
    isActive: true
  }
];

// User data with realistic information
const users = [
  {
    name: 'Admin User',
    email: 'admin@campusconnect.com',
    password: 'admin123',
    role: 'admin',
    studentId: 'ADMIN001',
    phone: '1234567890',
    department: 'Administration',
    createdAt: new Date('2024-01-15')
  },
  {
    name: 'John Doe',
    email: 'john@example.com',
    password: 'password123',
    role: 'user',
    studentId: 'STU001',
    phone: '9876543210',
    department: 'Computer Science',
    createdAt: new Date('2024-02-20')
  },
  {
    name: 'Sarah Johnson',
    email: 'sarah@example.com',
    password: 'password123',
    role: 'user',
    studentId: 'STU002',
    phone: '8765432109',
    department: 'Engineering',
    createdAt: new Date('2024-03-10')
  },
  {
    name: 'Mike Chen',
    email: 'mike@example.com',
    password: 'password123',
    role: 'user',
    studentId: 'STU003',
    phone: '7654321098',
    department: 'Physics',
    createdAt: new Date('2024-01-25')
  },
  {
    name: 'Emily Rodriguez',
    email: 'emily@example.com',
    password: 'password123',
    role: 'user',
    studentId: 'STU004',
    phone: '6543210987',
    department: 'Chemistry',
    createdAt: new Date('2024-04-05')
  }
];

// Comprehensive order data for each user
const orderData = {
  'john@example.com': [
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
  ],
  'sarah@example.com': [
    {
      rentalDays: 5,
      totalAmount: 250,
      status: 'returned',
      paymentStatus: 'paid',
      penaltyAmount: 0,
      startDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      expectedReturnDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      actualReturnDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      notes: 'Completed successfully'
    },
    {
      rentalDays: 7,
      totalAmount: 350,
      status: 'rented',
      paymentStatus: 'paid',
      penaltyAmount: 0,
      startDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      expectedReturnDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      notes: 'Active rental'
    },
    {
      rentalDays: 3,
      totalAmount: 150,
      status: 'returned',
      paymentStatus: 'paid',
      penaltyAmount: 30,
      startDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
      expectedReturnDate: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000),
      actualReturnDate: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
      notes: 'Returned early'
    }
  ],
  'mike@example.com': [
    {
      rentalDays: 10,
      totalAmount: 500,
      status: 'returned',
      paymentStatus: 'paid',
      penaltyAmount: 0,
      startDate: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
      expectedReturnDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      actualReturnDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      notes: 'Completed on time'
    },
    {
      rentalDays: 14,
      totalAmount: 700,
      status: 'rented',
      paymentStatus: 'paid',
      penaltyAmount: 0,
      startDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      expectedReturnDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
      notes: 'Currently active'
    },
    {
      rentalDays: 5,
      totalAmount: 250,
      status: 'confirmed',
      paymentStatus: 'paid',
      penaltyAmount: 0,
      startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      expectedReturnDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      notes: 'Confirmed rental'
    }
  ],
  'emily@example.com': [
    {
      rentalDays: 7,
      totalAmount: 350,
      status: 'returned',
      paymentStatus: 'paid',
      penaltyAmount: 0,
      startDate: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000),
      expectedReturnDate: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000),
      actualReturnDate: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000),
      notes: 'Completed successfully'
    },
    {
      rentalDays: 3,
      totalAmount: 150,
      status: 'rented',
      paymentStatus: 'paid',
      penaltyAmount: 20,
      startDate: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
      expectedReturnDate: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
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
      notes: 'Awaiting confirmation'
    }
  ]
};

const comprehensiveSeed = async () => {
  try {
    console.log('=== COMPREHENSIVE DATABASE SEEDING ===\n');
    
    // Clear existing data
    await User.deleteMany({});
    await Product.deleteMany({});
    await Order.deleteMany({});
    
    console.log('✅ Cleared existing data');

    // Create users
    const createdUsers = [];
    for (const userData of users) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const user = await User.create({
        ...userData,
        password: hashedPassword
      });
      createdUsers.push(user);
      console.log(`✅ Created user: ${user.name} (${user.email})`);
    }

    // Create products
    const createdProducts = await Product.create(products);
    console.log(`✅ Created ${createdProducts.length} products`);

    // Create orders for each user
    const allOrders = [];
    for (const user of createdUsers) {
      if (user.role === 'user' && orderData[user.email]) {
        const userOrders = orderData[user.email];
        
        for (const orderDataItem of userOrders) {
          // Select random products for each order
          const selectedProducts = [];
          const numProducts = Math.floor(Math.random() * 2) + 1;
          
          for (let j = 0; j < numProducts; j++) {
            const product = createdProducts[Math.floor(Math.random() * createdProducts.length)];
            selectedProducts.push({
              product: product._id,
              quantity: Math.floor(Math.random() * 2) + 1,
              pricePerDay: product.pricePerDay,
              totalPrice: product.pricePerDay * orderDataItem.rentalDays
            });
          }

          const order = await Order.create({
            user: user._id,
            items: selectedProducts,
            rentalDays: orderDataItem.rentalDays,
            totalAmount: orderDataItem.totalAmount,
            status: orderDataItem.status,
            paymentStatus: orderDataItem.paymentStatus,
            penaltyAmount: orderDataItem.penaltyAmount,
            startDate: orderDataItem.startDate,
            expectedReturnDate: orderDataItem.expectedReturnDate,
            actualReturnDate: orderDataItem.actualReturnDate,
            notes: orderDataItem.notes
          });

          allOrders.push(order);
          console.log(`✅ Created order for ${user.name}: ${orderDataItem.status} - ₹${orderDataItem.totalAmount}`);
        }
      }
    }

    // Calculate and display comprehensive statistics
    console.log('\n=== COMPREHENSIVE DATABASE STATISTICS ===');
    
    const totalUsers = createdUsers.filter(u => u.role === 'user').length;
    const totalProducts = createdProducts.length;
    const totalOrders = allOrders.length;
    
    const totalSpent = allOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    const totalPenalty = allOrders.reduce((sum, order) => sum + order.penaltyAmount, 0);
    const activeRentals = allOrders.filter(order => ['confirmed', 'rented'].includes(order.status)).length;
    const overdueRentals = allOrders.filter(order => {
      return ['confirmed', 'rented'].includes(order.status) && 
             new Date() > order.expectedReturnDate;
    }).length;

    console.log(`📊 Total Users: ${totalUsers}`);
    console.log(`📦 Total Products: ${totalProducts}`);
    console.log(`🛒 Total Orders: ${totalOrders}`);
    console.log(`💰 Total Revenue: ₹${totalSpent}`);
    console.log(`⚠️ Total Penalties: ₹${totalPenalty}`);
    console.log(`🔄 Active Rentals: ${activeRentals}`);
    console.log(`⏰ Overdue Rentals: ${overdueRentals}`);
    console.log(`📈 Average Order Value: ₹${Math.round(totalSpent / totalOrders)}`);

    // User-specific statistics
    console.log('\n=== USER-SPECIFIC STATISTICS ===');
    for (const user of createdUsers.filter(u => u.role === 'user')) {
      const userOrders = allOrders.filter(order => order.user.toString() === user._id.toString());
      const userTotalSpent = userOrders.reduce((sum, order) => sum + order.totalAmount, 0);
      const userActiveRentals = userOrders.filter(order => ['confirmed', 'rented'].includes(order.status)).length;
      const userOverdueRentals = userOrders.filter(order => {
        return ['confirmed', 'rented'].includes(order.status) && 
               new Date() > order.expectedReturnDate;
      }).length;
      
      console.log(`${user.name} (${user.email}):`);
      console.log(`  - Orders: ${userOrders.length}`);
      console.log(`  - Total Spent: ₹${userTotalSpent}`);
      console.log(`  - Active Rentals: ${userActiveRentals}`);
      console.log(`  - Overdue Rentals: ${userOverdueRentals}`);
    }

    console.log('\n✅ COMPREHENSIVE DATABASE SEEDING COMPLETED!');
    console.log('\n📋 LOGIN CREDENTIALS:');
    console.log('Admin: admin@campusconnect.com / admin123');
    console.log('Users: Check the user-specific statistics above for email addresses');
    console.log('All user passwords: password123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error during comprehensive seeding:', error);
    process.exit(1);
  }
};

comprehensiveSeed(); 