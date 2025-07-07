const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { protect, authorize } = require('../middleware/auth');
const nodemailer = require('nodemailer');

const router = express.Router();

// All routes require admin access
router.use(protect, authorize('admin'));

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard statistics
// @access  Private/Admin
router.get('/dashboard', async (req, res) => {
  try {
    // Get total users
    const totalUsers = await User.countDocuments({ role: 'user' });
    
    // Get total products
    const totalProducts = await Product.countDocuments({ isActive: true });
    
    // Get total orders (excluding cancelled/rejected orders)
    const totalOrders = await Order.countDocuments({ status: { $ne: 'cancelled' } });
    
    // Get admin cancelled orders count
    const adminCancelledOrders = await Order.countDocuments({ 
      status: 'cancelled',
      cancelledBy: 'admin'
    });
    
    // Get user cancelled orders count
    const userCancelledOrders = await Order.countDocuments({ 
      status: 'cancelled',
      cancelledBy: 'user'
    });
    
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

    // Ensure we have default values if no revenue stats
    const defaultRevenueStats = {
      totalRevenue: 0,
      totalPenalty: 0,
      pendingOrders: 0,
      activeRentals: 0,
      overdueRentals: 0
    };

    // Get recent orders (including cancelled orders so admin can see all transactions)
    const recentOrders = await Order.find()
      .populate('user', 'name email studentId')
      .populate('items.product')
      .sort({ createdAt: -1 })
      .limit(10);

    // Get low stock products
    const lowStockProducts = await Product.find({
      isActive: true,
      availableQuantity: { $lte: 5 }
    }).sort({ availableQuantity: 1 });



    res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalProducts,
          totalOrders,
          adminCancelledOrders, // Admin cancelled orders count
          userCancelledOrders, // User cancelled orders count
          ...(revenueStats[0] || defaultRevenueStats)
        },
        recentOrders,
        lowStockProducts
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Private/Admin
router.get('/users', async (req, res) => {
  try {
    const { search, limit = 10, page = 1, status } = req.query;
    
    let query = { role: 'user' };
    
    // Add status filter
    if (status && status !== 'all') {
      if (status === 'active') {
        query.isActive = true;
      } else if (status === 'inactive') {
        query.isActive = false;
      }
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await User.countDocuments(query);

    // Aggregate order counts for each user
    const userIds = users.map(u => u._id);
    
    // Get total orders per user
    const ordersAgg = await Order.aggregate([
      { $match: { user: { $in: userIds } } },
      { $group: { _id: '$user', totalRentals: { $sum: 1 } } }
    ]);
    
    // Get successful orders (confirmed, rented, returned) per user
    const successfulAgg = await Order.aggregate([
      { $match: { user: { $in: userIds }, status: { $in: ['confirmed', 'rented', 'returned'] } } },
      { $group: { _id: '$user', successfulOrders: { $sum: 1 } } }
    ]);
    
    // Get declined/cancelled orders per user
    const declinedAgg = await Order.aggregate([
      { $match: { user: { $in: userIds }, status: 'cancelled' } },
      { $group: { _id: '$user', declinedOrders: { $sum: 1 } } }
    ]);
    
    // Get active rentals per user
    const activeAgg = await Order.aggregate([
      { $match: { user: { $in: userIds }, status: { $in: ['confirmed', 'rented'] } } },
      { $group: { _id: '$user', activeRentals: { $sum: 1 } } }
    ]);
    
    // Convert to maps for quick lookup
    const ordersMap = Object.fromEntries(ordersAgg.map(o => [o._id.toString(), o.totalRentals]));
    const successfulMap = Object.fromEntries(successfulAgg.map(s => [s._id.toString(), s.successfulOrders]));
    const declinedMap = Object.fromEntries(declinedAgg.map(d => [d._id.toString(), d.declinedOrders]));
    const activeMap = Object.fromEntries(activeAgg.map(a => [a._id.toString(), a.activeRentals]));

    // Attach counts to each user
    const usersWithCounts = users.map(user => {
      const id = user._id.toString();
      return {
        ...user.toObject(),
        totalRentals: ordersMap[id] || 0,
        successfulOrders: successfulMap[id] || 0,
        declinedOrders: declinedMap[id] || 0,
        activeRentals: activeMap[id] || 0
      };
    });

    res.json({
      success: true,
      count: usersWithCounts.length,
      total,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        hasNext: skip + usersWithCounts.length < total,
        hasPrev: parseInt(page) > 1
      },
      data: usersWithCounts
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/users/:id
// @desc    Get single user with orders
// @access  Private/Admin
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const orders = await Order.find({ user: req.params.id })
      .populate('items.product')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        user,
        orders
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/admin/users/:id
// @desc    Update user (admin only)
// @access  Private/Admin
router.put('/users/:id', [
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('email').optional().isEmail().withMessage('Please enter a valid email'),
  body('phone').optional().notEmpty().withMessage('Phone cannot be empty'),
  body('department').optional().notEmpty().withMessage('Department cannot be empty'),
  body('role').optional().isIn(['user', 'admin']).withMessage('Invalid role')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PATCH /api/admin/users/:id/toggle-status
// @desc    Toggle user active status
// @access  Private/Admin
router.patch('/users/:id/toggle-status', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Toggle the isActive status
    user.isActive = !user.isActive;
    await user.save();

    res.json({
      success: true,
      data: {
        _id: user._id,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete user (admin only)
// @access  Private/Admin
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user has any active orders
    const activeOrders = await Order.find({
      user: req.params.id,
      status: { $in: ['confirmed', 'rented'] }
    });

    if (activeOrders.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete user with active orders. Please handle active orders first.' 
      });
    }

    // Delete user's orders first
    await Order.deleteMany({ user: req.params.id });
    
    // Delete the user
    await User.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/orders
// @desc    Get all orders
// @access  Private/Admin
router.get('/orders', async (req, res) => {
  try {
    const { status, search, limit = 100, page = 1 } = req.query;
    
    let query = {};
    if (status) {
      query.status = status;
    }
    
    if (search) {
      query.$or = [
        { 'user.name': { $regex: search, $options: 'i' } },
        { 'user.email': { $regex: search, $options: 'i' } },
        { 'user.studentId': { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const orders = await Order.find(query)
      .populate('user', 'name email studentId department')
      .populate('items.product')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      count: orders.length,
      total,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        hasNext: skip + orders.length < total,
        hasPrev: parseInt(page) > 1
      },
      data: orders
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/orders/overdue
// @desc    Get all overdue orders
// @access  Private/Admin
router.get('/orders/overdue', async (req, res) => {
  try {
    const overdueOrders = await Order.find({
      status: { $in: ['confirmed', 'rented'] },
      expectedReturnDate: { $lt: new Date() }
    })
    .populate('user', 'name email studentId department')
    .populate('items.product')
    .sort({ expectedReturnDate: 1 });

    res.json({
      success: true,
      count: overdueOrders.length,
      data: overdueOrders
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/products
// @desc    Get all products with filtering
// @access  Private/Admin
router.get('/products', async (req, res) => {
  try {
    const { status = 'all', search = '', limit = 50, page = 1 } = req.query;
    
    let query = { isActive: true };
    
    // Filter by status
    if (status === 'available') {
      query.availableQuantity = { $gt: 0 };
    } else if (status === 'low-stock') {
      query.availableQuantity = { $lte: 5, $gt: 0 };
    } else if (status === 'out-of-stock') {
      query.availableQuantity = { $lte: 0 };
    }
    
    // Search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Product.countDocuments(query);

    res.json({
      success: true,
      count: products.length,
      total,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        hasNext: skip + products.length < total,
        hasPrev: parseInt(page) > 1
      },
      data: products
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/products/inventory
// @desc    Get inventory status
// @access  Private/Admin
router.get('/products/inventory', async (req, res) => {
  try {
    const products = await Product.find({ isActive: true })
      .sort({ availableQuantity: 1 });

    const inventoryStats = await Product.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          totalItems: { $sum: '$totalQuantity' },
          availableItems: { $sum: '$availableQuantity' },
          rentedItems: { $sum: { $subtract: ['$totalQuantity', '$availableQuantity'] } },
          lowStockItems: {
            $sum: {
              $cond: [{ $lte: ['$availableQuantity', 5] }, 1, 0]
            }
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        products,
        stats: inventoryStats[0] || {
          totalItems: 0,
          availableItems: 0,
          rentedItems: 0,
          lowStockItems: 0
        }
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/admin/products/:id/restock
// @desc    Restock product
// @access  Private/Admin
router.post('/products/:id/restock', [
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    product.totalQuantity += req.body.quantity;
    product.availableQuantity += req.body.quantity;
    await product.save();

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/admin/products
// @desc    Create a new product
// @access  Private/Admin
router.post('/products', [
  body('name').notEmpty().withMessage('Product name is required'),
  body('description').notEmpty().withMessage('Product description is required'),
  body('category').isIn(['mini-drafter', 'lab-apron']).withMessage('Invalid category'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('pricePerDay').isFloat({ min: 0 }).withMessage('Price per day must be a positive number'),
  body('totalQuantity').isInt({ min: 1 }).withMessage('Total quantity must be at least 1'),
  body('availableQuantity').isInt({ min: 0 }).withMessage('Available quantity cannot be negative'),
  body('images').custom((value) => {
    if (Array.isArray(value)) return true;
    if (typeof value === 'string') return true;
    throw new Error('Images must be an array or string');
  }).withMessage('Images must be an array or string'),
  body('specifications').optional().isObject().withMessage('Specifications must be an object'),
  body('condition').optional().isIn(['new', 'good', 'fair', 'poor']).withMessage('Invalid condition')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Handle price precision before saving
    if (req.body.price !== undefined) {
      req.body.price = Number.isInteger(req.body.price) ? req.body.price : Math.round(req.body.price * 100) / 100;
    }
    
    if (req.body.pricePerDay !== undefined) {
      req.body.pricePerDay = Number.isInteger(req.body.pricePerDay) ? req.body.pricePerDay : Math.round(req.body.pricePerDay * 100) / 100;
    }

    const product = new Product(req.body);
    await product.save();

    res.status(201).json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/admin/products/:id
// @desc    Update a product
// @access  Private/Admin
router.put('/products/:id', [
  body('name').optional().notEmpty().withMessage('Product name cannot be empty'),
  body('description').optional().notEmpty().withMessage('Product description cannot be empty'),
  body('category').optional().isIn(['mini-drafter', 'lab-apron']).withMessage('Invalid category'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('pricePerDay').optional().isFloat({ min: 0 }).withMessage('Price per day must be a positive number'),
  body('totalQuantity').optional().isInt({ min: 1 }).withMessage('Total quantity must be at least 1'),
  body('availableQuantity').optional().isInt({ min: 0 }).withMessage('Available quantity cannot be negative'),
  body('images').optional().custom((value) => {
    if (Array.isArray(value)) return true;
    if (typeof value === 'string') return true;
    throw new Error('Images must be an array or string');
  }).withMessage('Images must be an array or string'),
  body('specifications').optional().isObject().withMessage('Specifications must be an object'),
  body('condition').optional().isIn(['new', 'good', 'fair', 'poor']).withMessage('Invalid condition')
], async (req, res) => {
  try {
    console.log('PUT /api/admin/products/:id - Request body:', req.body);
    console.log('PUT /api/admin/products/:id - Product ID:', req.params.id);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    // Handle price precision before saving
    if (req.body.price !== undefined) {
      req.body.price = Number.isInteger(req.body.price) ? req.body.price : Math.round(req.body.price * 100) / 100;
    }
    
    if (req.body.pricePerDay !== undefined) {
      req.body.pricePerDay = Number.isInteger(req.body.pricePerDay) ? req.body.pricePerDay : Math.round(req.body.pricePerDay * 100) / 100;
    }

    const product = await Product.findById(req.params.id);
    
    if (!product) {
      console.log('Product not found with ID:', req.params.id);
      return res.status(404).json({ message: 'Product not found' });
    }

    console.log('Found product:', product);
    console.log('Updating with data:', req.body);
    
    Object.assign(product, req.body);
    await product.save();

    console.log('Product updated successfully');
    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/admin/products/:id
// @desc    Delete a product
// @access  Private/Admin
router.delete('/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Soft delete - mark as inactive instead of actually deleting
    product.isActive = false;
    await product.save();

    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/admin/products/:id/reduce-stock
// @desc    Reduce product stock
// @access  Private/Admin
router.post('/products/:id/reduce-stock', [
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if we can reduce the stock
    if (product.totalQuantity < req.body.quantity) {
      return res.status(400).json({ message: 'Cannot reduce more than total quantity' });
    }

    if (product.availableQuantity < req.body.quantity) {
      return res.status(400).json({ message: 'Cannot reduce more than available quantity' });
    }

    product.totalQuantity -= req.body.quantity;
    product.availableQuantity -= req.body.quantity;
    await product.save();

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/admin/orders/:id/status
// @desc    Update order status (Admin only)
// @access  Private/Admin
router.put('/orders/:id/status', [
  body('status').isIn(['pending', 'confirmed', 'rented', 'delivered', 'returned', 'overdue', 'cancelled'])
    .withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const order = await Order.findById(req.params.id)
      .populate('items.product');
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const previousStatus = order.status;
    order.status = req.body.status;
    
    console.log('DEBUG: Admin status update - Previous status:', previousStatus, 'New status:', req.body.status);
    
    if (req.body.status === 'cancelled') {
      order.cancelledBy = 'admin';
    }

    // Handle inventory restoration when order is cancelled or returned
    if ((req.body.status === 'cancelled' && previousStatus !== 'cancelled') || 
        (req.body.status === 'returned' && previousStatus !== 'returned')) {
      // Return items to inventory
      for (const item of order.items) {
        const product = await Product.findById(item.product._id);
        if (product) {
          product.availableQuantity += item.quantity;
          await product.save();
        }
      }
    }

    // Send confirmation email if status changed to confirmed
    if (previousStatus !== 'confirmed' && req.body.status === 'confirmed') {
      console.log('DEBUG: Attempting to send confirmation email for order:', order._id);
      try {
        // Populate user for email
        await order.populate('user');
        const user = order.user;
        console.log('DEBUG: User email for confirmation:', user.email);
        console.log('DEBUG: User name for confirmation:', user.name);
        
        if (!user.email) {
          console.error('DEBUG: User email is missing for order:', order._id);
          throw new Error('User email not found');
        }
        
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
          }
        });
        const itemLines = order.items.map(item =>
          `<li><b>${item.product.name}</b> (x${item.quantity}) for ${order.rentalDays} days: ₹${item.totalPrice}</li>`
        ).join('');
        const htmlBody = `
          <h2>Your Order is Confirmed!</h2>
          <p>Dear ${user.name},</p>
          <p>Your order has been <b>confirmed</b> and will be processed soon.</p>
          <p><b>Order ID:</b> ${order._id}</p>
          <p><b>Delivery Address:</b> ${order.deliveryAddress}</p>
          <p><b>Delivery Instructions:</b> ${order.deliveryInstructions || 'N/A'}</p>
          <p><b>Payment Method:</b> ${order.paymentMethod}</p>
          <p><b>Total Amount:</b> ₹${order.totalAmount}</p>
          <p><b>Placed at:</b> ${order.createdAt}</p>
          <h3>Items:</h3>
          <ul>${itemLines}</ul>
          <p>Thank you for choosing us!</p>
        `;
        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: user.email,
          subject: `Order Confirmed: #${order._id.toString().slice(-8).toUpperCase()}`,
          text:
`Dear ${user.name},\n\nYour order has been confirmed!\n\nOrder ID: ${order._id}\nDelivery Address: ${order.deliveryAddress}\nDelivery Instructions: ${order.deliveryInstructions || 'N/A'}\nPayment Method: ${order.paymentMethod}\nTotal Amount: ₹${order.totalAmount}\n\nWe will process your order soon. Thank you for choosing us!`,
          html: htmlBody
        };
        console.log('DEBUG: Sending email to:', user.email);
        await transporter.sendMail(mailOptions);
        console.log('Order confirmation email sent to user:', user.email, 'for order:', order._id);
      } catch (userMailErr) {
        console.error('Failed to send order confirmation email to user for order', order._id, userMailErr);
      }
    }

    // Send cancellation email if status changed to cancelled
    if (previousStatus !== 'cancelled' && req.body.status === 'cancelled') {
      console.log('DEBUG: Attempting to send cancellation email for order:', order._id);
      try {
        // Populate user for email
        await order.populate('user');
        const user = order.user;
        console.log('DEBUG: User email for cancellation:', user.email);
        
        if (!user.email) {
          console.error('DEBUG: User email is missing for order:', order._id);
          throw new Error('User email not found');
        }
        
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
          }
        });
        const itemLines = order.items.map(item =>
          `<li><b>${item.product.name}</b> (x${item.quantity}) for ${order.rentalDays} days: ₹${item.totalPrice}</li>`
        ).join('');
        const htmlBody = `
          <h2>Your Order has been Declined</h2>
          <p>Dear ${user.name},</p>
          <p>We regret to inform you that your order has been <b>declined</b> by the admin.</p>
          <p><b>Order ID:</b> ${order._id}</p>
          <p><b>Delivery Address:</b> ${order.deliveryAddress}</p>
          <p><b>Delivery Instructions:</b> ${order.deliveryInstructions || 'N/A'}</p>
          <p><b>Payment Method:</b> ${order.paymentMethod}</p>
          <p><b>Total Amount:</b> ₹${order.totalAmount}</p>
          <p><b>Placed at:</b> ${order.createdAt}</p>
          <h3>Items:</h3>
          <ul>${itemLines}</ul>
          <p>If you have any questions, please contact support.</p>
        `;
        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: user.email,
          subject: `Order Declined: #${order._id.toString().slice(-8).toUpperCase()}`,
          text:
`Dear ${user.name},\n\nWe regret to inform you that your order has been declined by the admin.\n\nOrder ID: ${order._id}\nDelivery Address: ${order.deliveryAddress}\nDelivery Instructions: ${order.deliveryInstructions || 'N/A'}\nPayment Method: ${order.paymentMethod}\nTotal Amount: ₹${order.totalAmount}\n\nIf you have any questions, please contact support.`,
          html: htmlBody
        };
        console.log('DEBUG: Sending cancellation email to:', user.email);
        await transporter.sendMail(mailOptions);
        console.log('Order cancellation email sent to user:', user.email, 'for order:', order._id);
      } catch (userMailErr) {
        console.error('Failed to send order cancellation email to user for order', order._id, userMailErr);
      }
    }

    // Send return confirmation email if status changed to returned
    if (previousStatus !== 'returned' && req.body.status === 'returned') {
      console.log('DEBUG: Attempting to send return confirmation email for order:', order._id);
      try {
        // Populate user for email
        await order.populate('user');
        const user = order.user;
        console.log('DEBUG: User email for return confirmation:', user.email);
        
        if (!user.email) {
          console.error('DEBUG: User email is missing for order:', order._id);
          throw new Error('User email not found');
        }
        
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
          }
        });
        
        const itemLines = order.items.map(item =>
          `<li><b>${item.product.name}</b> (x${item.quantity}) for ${order.rentalDays} days: ₹${item.totalPrice}</li>`
        ).join('');
        
        const htmlBody = `
          <h2>Your Order is Returned!</h2>
          <p>Dear ${user.name},</p>
          <p>Your order has been returned.</p>
          <p><b>Order ID:</b> ${order._id}</p>
          <p><b>Delivery Address:</b> ${order.deliveryAddress}</p>
          <p><b>Delivery Instructions:</b> ${order.deliveryInstructions || 'N/A'}</p>
          <p><b>Payment Method:</b> ${order.paymentMethod}</p>
          <p><b>Total Amount:</b> ₹${order.totalAmount}</p>
          <p><b>Placed at:</b> ${order.createdAt}</p>
          <h3>Items:</h3>
          <ul>${itemLines}</ul>
          <p>Thank you for choosing us!</p>
        `;
        
        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: user.email,
          subject: `Items Returned Successfully: #${order._id.toString().slice(-8).toUpperCase()}`,
          text:
`Dear ${user.name},\n\nYour order has been returned.\n\nOrder ID: ${order._id}\nDelivery Address: ${order.deliveryAddress}\nDelivery Instructions: ${order.deliveryInstructions || 'N/A'}\nPayment Method: ${order.paymentMethod}\nTotal Amount: ₹${order.totalAmount}\nPlaced at: ${order.createdAt}\n\nThank you for choosing us!`,
          html: htmlBody
        };
        
        console.log('DEBUG: Sending return confirmation email to:', user.email);
        await transporter.sendMail(mailOptions);
        console.log('Return confirmation email sent to user:', user.email, 'for order:', order._id);
      } catch (userMailErr) {
        console.error('Failed to send return confirmation email to user for order', order._id, userMailErr);
      }
    }

    await order.save();

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// TEMP DEBUG: Get all orders with full user and item info
router.get('/debug-orders', async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate('user')
      .populate('items.product');
    res.json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 