const express = require('express');
const { body, validationResult } = require('express-validator');
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/products
// @desc    Get all products
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { category, search, sort, limit = 10, page = 1, condition, priceMin, priceMax } = req.query;
    
    // Build query
    let query = { isActive: true, isSold: { $ne: true } };
    
    if (category) {
      query.category = category;
    }
    
    if (condition) {
      query.condition = condition;
    }
    
    if (priceMin || priceMax) {
      query.price = {};
      if (priceMin) query.price.$gte = parseFloat(priceMin);
      if (priceMax) query.price.$lte = parseFloat(priceMax);
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    
    // Build sort
    let sortOption = {};
    if (sort) {
      const [field, order] = sort.split(':');
      sortOption[field] = order === 'desc' ? -1 : 1;
    } else {
      sortOption = { createdAt: -1 };
    }
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const products = await Product.find(query)
      .populate('seller', 'name profilePicture sellerRating')
      .sort(sortOption)
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

// @route   GET /api/products/my-products
// @desc    Get current user's products
// @access  Private
router.get('/my-products', protect, async (req, res) => {
  try {
    console.log('=== /my-products endpoint called ===');
    console.log('User ID:', req.user.id);
    console.log('User:', req.user);
    
    const { limit = 10, page = 1 } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // First, let's check if there are any products in the database
    const allProducts = await Product.find({});
    console.log('Total products in database:', allProducts.length);
    console.log('Sample product:', allProducts[0]);
    
    const products = await Product.find({ 
      seller: req.user.id
    })
    .populate('seller', 'name profilePicture')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip(skip);
    
    console.log('Products found for user:', products.length);
    console.log('Products:', products);
    
    const total = await Product.countDocuments({ 
      seller: req.user.id
    });
    
    console.log('Total count for user:', total);
    
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
    console.error('Error in /my-products:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/products/favorites
// @desc    Get user's favorite products
// @access  Private
router.get('/favorites', protect, async (req, res) => {
  try {
    const { limit = 10, page = 1 } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const products = await Product.find({ 
      favorites: req.user.id,
      isActive: true
    })
    .populate('seller', 'name profilePicture sellerRating')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip(skip);
    
    const total = await Product.countDocuments({ 
      favorites: req.user.id,
      isActive: true
    });
    
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

// @route   GET /api/products/purchased
// @desc    Get products purchased by current user
// @access  Private
router.get('/purchased', protect, async (req, res) => {
  try {
    const { limit = 10, page = 1 } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const products = await Product.find({ 
      soldTo: req.user.id
    })
    .populate('seller', 'name profilePicture sellerRating')
    .sort({ soldAt: -1 })
    .limit(parseInt(limit))
    .skip(skip);
    
    const total = await Product.countDocuments({ 
      soldTo: req.user.id
    });
    
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

// @route   GET /api/products/:id
// @desc    Get single product
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('seller', 'name profilePicture sellerRating sellerDescription totalSales totalTransactions');
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Increment view count
    product.views += 1;
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

// @route   POST /api/products
// @desc    Create new product
// @access  Private
router.post('/', [
  protect,
  body('title').notEmpty().withMessage('Product title is required'),
  body('description').notEmpty().withMessage('Product description is required'),
  body('category').isIn(['books', 'electronics', 'furniture', 'clothing', 'sports', 'musical-instruments', 'lab-equipment', 'stationery', 'other']).withMessage('Invalid category'),
  body('price').isNumeric().withMessage('Price must be a number'),
  body('condition').isIn(['new', 'like-new', 'good', 'fair', 'poor']).withMessage('Invalid condition'),
  body('images').isArray({ min: 1 }).withMessage('At least one image is required'),
  body('contactInfo.phone').notEmpty().withMessage('Contact phone is required'),
  body('contactInfo.email').isEmail().withMessage('Valid contact email is required'),
  body('location').notEmpty().withMessage('Location is required')
], async (req, res) => {
  try {
    console.log('Received product data:', req.body);
    console.log('User ID:', req.user.id);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }
    
    const productData = {
      ...req.body,
      seller: req.user.id
    };
    
    console.log('=== Creating product ===');
    console.log('User ID:', req.user.id);
    console.log('Product data to create:', productData);
    
    const product = await Product.create(productData);
    
    console.log('Product created successfully:', product);
    
    // Populate seller info
    await product.populate('seller', 'name profilePicture');
    
    res.status(201).json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/products/:id
// @desc    Update product
// @access  Private (seller only)
router.put('/:id', [
  protect,
  body('title').optional().notEmpty().withMessage('Product title cannot be empty'),
  body('description').optional().notEmpty().withMessage('Product description cannot be empty'),
  body('category').optional().isIn(['books', 'electronics', 'furniture', 'clothing', 'sports', 'musical-instruments', 'lab-equipment', 'stationery', 'other']).withMessage('Invalid category'),
  body('price').optional().isNumeric().withMessage('Price must be a number'),
  body('condition').optional().isIn(['new', 'like-new', 'good', 'fair', 'poor']).withMessage('Invalid condition')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    let product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Check if user is the seller
    if (product.seller.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this product' });
    }
    
    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('seller', 'name profilePicture');
    
    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/products/:id
// @desc    Delete product
// @access  Private (seller only)
router.delete('/:id', protect, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Check if user is the seller
    if (product.seller.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this product' });
    }
    
    // Soft delete - just mark as inactive
    product.isActive = false;
    await product.save();
    
    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/products/user/:userId
// @desc    Get products by user (seller)
// @access  Public
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 10, page = 1 } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const products = await Product.find({ 
      seller: userId,
      isActive: true 
    })
    .populate('seller', 'name profilePicture sellerRating')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip(skip);
    
    const total = await Product.countDocuments({ 
      seller: userId,
      isActive: true 
    });
    
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

// @route   POST /api/products/:id/favorite
// @desc    Add/remove product to favorites
// @access  Private
router.post('/:id/favorite', protect, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    const isFavorited = product.favorites.includes(req.user.id);
    
    if (isFavorited) {
      product.favorites = product.favorites.filter(id => id.toString() !== req.user.id);
    } else {
      product.favorites.push(req.user.id);
    }
    
    await product.save();
    
    res.json({
      success: true,
      isFavorited: !isFavorited,
      message: isFavorited ? 'Removed from favorites' : 'Added to favorites'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/products/:id/mark-sold
// @desc    Mark product as sold
// @access  Private (seller only)
router.put('/:id/mark-sold', protect, async (req, res) => {
  try {
    const { buyerId } = req.body;
    
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Check if user is the seller
    if (product.seller.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to mark this product as sold' });
    }
    
    if (product.isSold) {
      return res.status(400).json({ message: 'Product is already marked as sold' });
    }
    
    product.isSold = true;
    product.soldAt = new Date();
    product.soldTo = buyerId;
    product.isActive = false; // Hide from active listings
    
    await product.save();
    
    res.json({
      success: true,
      message: 'Product marked as sold successfully',
      data: product
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/products/:id/rate-seller
// @desc    Rate seller for a purchased product
// @access  Private (buyer only)
router.post('/:id/rate-seller', protect, [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('review').optional().isString().withMessage('Review must be a string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { rating, review } = req.body;
    
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Check if user is the buyer
    if (product.soldTo.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to rate this product' });
    }
    
    if (product.buyerRating) {
      return res.status(400).json({ message: 'You have already rated this seller' });
    }
    
    product.buyerRating = rating;
    product.buyerReview = review;
    
    await product.save();
    
    // Update seller's average rating
    const User = require('../models/User');
    const seller = await User.findById(product.seller);
    
    if (seller) {
      const sellerProducts = await Product.find({ 
        seller: product.seller,
        buyerRating: { $exists: true, $ne: null }
      });
    
      const totalRating = sellerProducts.reduce((sum, p) => sum + p.buyerRating, 0);
      seller.sellerRating = totalRating / sellerProducts.length;
      seller.sellerRatingCount = sellerProducts.length;
      
      await seller.save();
    }
    
    res.json({
      success: true,
      message: 'Seller rated successfully',
      data: product
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/products/:id/rate-buyer
// @desc    Rate buyer for a sold product
// @access  Private (seller only)
router.post('/:id/rate-buyer', protect, [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('review').optional().isString().withMessage('Review must be a string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { rating, review } = req.body;
    
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Check if user is the seller
    if (product.seller.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to rate this buyer' });
    }
    
    if (product.sellerRating) {
      return res.status(400).json({ message: 'You have already rated this buyer' });
    }
    
    product.sellerRating = rating;
    product.sellerReview = review;
    
    await product.save();
    
    // Update buyer's average rating
    const User = require('../models/User');
    const buyer = await User.findById(product.soldTo);
    
    if (buyer) {
      const buyerProducts = await Product.find({ 
        soldTo: product.soldTo,
        sellerRating: { $exists: true, $ne: null }
      });
      
      const totalRating = buyerProducts.reduce((sum, p) => sum + p.sellerRating, 0);
      buyer.buyerRating = totalRating / buyerProducts.length;
      buyer.buyerRatingCount = buyerProducts.length;
      
      await buyer.save();
    }
    
    res.json({
      success: true,
      message: 'Buyer rated successfully',
      data: product
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 