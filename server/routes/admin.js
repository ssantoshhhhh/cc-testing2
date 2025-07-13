const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Product = require('../models/Product');
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
    
    // Get active sellers
    const activeSellers = await User.countDocuments({ 
      role: 'user',
      isActive: true,
      isSeller: true
    });
    
    // Get total transactions (placeholder for future implementation)
    const totalTransactions = 0;
    const totalRevenue = 0;
    const activeListings = await Product.countDocuments({ 
      isActive: true,
      availableQuantity: { $gt: 0 }
    });
    const reportedItems = 0; // Placeholder for future implementation

    // Get low stock products
    const lowStockProducts = await Product.find({
      isActive: true,
      availableQuantity: { $lte: 5 }
    }).sort({ availableQuantity: 1 });

    // Get recent products instead of orders
    const recentProducts = await Product.find({ isActive: true })
      .populate('seller', 'name email studentId')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalProducts,
          activeSellers,
          totalTransactions,
          totalRevenue,
          activeListings,
          reportedItems
        },
        recentProducts,
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

    // Aggregate marketplace statistics for each user
    const userIds = users.map(u => u._id);
    
    // Get total listings per user
    const listingsAgg = await Product.aggregate([
      { $match: { seller: { $in: userIds } } },
      { $group: { _id: '$seller', totalListings: { $sum: 1 } } }
    ]);
    
    // Get active listings per user
    const activeListingsAgg = await Product.aggregate([
      { $match: { seller: { $in: userIds }, availableQuantity: { $gt: 0 } } },
      { $group: { _id: '$seller', activeListings: { $sum: 1 } } }
    ]);
    
    // Get total sales per user (placeholder for future implementation)
    const salesAgg = await Product.aggregate([
      { $match: { seller: { $in: userIds } } },
      { $group: { _id: '$seller', totalSales: { $sum: '$price' } } }
    ]);
    
    // Convert to maps for quick lookup
    const listingsMap = Object.fromEntries(listingsAgg.map(l => [l._id.toString(), l.totalListings]));
    const activeListingsMap = Object.fromEntries(activeListingsAgg.map(a => [a._id.toString(), a.activeListings]));
    const salesMap = Object.fromEntries(salesAgg.map(s => [s._id.toString(), s.totalSales]));

    // Attach marketplace stats to each user
    const usersWithStats = users.map(user => {
      const id = user._id.toString();
      return {
        ...user.toObject(),
        totalListings: listingsMap[id] || 0,
        activeListings: activeListingsMap[id] || 0,
        totalSales: salesMap[id] || 0,
        isSeller: user.isSeller || false
      };
    });

    res.json({
      success: true,
      count: usersWithStats.length,
      total,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        hasNext: skip + usersWithStats.length < total,
        hasPrev: parseInt(page) > 1
      },
      data: usersWithStats
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/users/:id
// @desc    Get single user with marketplace data
// @access  Private/Admin
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const products = await Product.find({ seller: req.params.id })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        user,
        products
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

    // Check if user has any active listings
    const activeListings = await Product.find({
      seller: req.params.id,
      availableQuantity: { $gt: 0 }
    });

    if (activeListings.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete user with active listings. Please remove all listings first.' 
      });
    }

    // Send account deletion notification email
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: 'Account Deleted - Campus Connect',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Account Deletion Notification</h2>
            <p>Hello ${user.name},</p>
            <p>Your account has been deleted by an administrator from Campus Connect.</p>
            <p><strong>Account Details:</strong></p>
            <ul>
              <li>Name: ${user.name}</li>
              <li>Email: ${user.email}</li>
              <li>Student ID: ${user.studentId}</li>
              <li>Department: ${user.department || 'Not specified'}</li>
            </ul>
            <p><strong>What this means:</strong></p>
            <ul>
              <li>All your account data has been permanently removed</li>
              <li>Your marketplace activity has been deleted</li>
              <li>You will no longer be able to access the platform</li>
              <li>If you believe this was done in error, please contact the administration</li>
            </ul>
            <p>If you have any questions or concerns, please contact the Campus Connect administration.</p>
            <p>Best regards,<br>Campus Connect Team</p>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
    } catch (emailError) {
      console.error('Failed to send account deletion notification email:', emailError);
      // Continue with deletion even if email fails
    }

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



module.exports = router; 