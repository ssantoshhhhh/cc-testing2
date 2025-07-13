const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');

// Get user's transaction history (both as buyer and seller)
router.get('/', protect, async (req, res) => {
  try {
    const { type, status } = req.query;
    let query = {
      $or: [{ buyer: req.user.id }, { seller: req.user.id }]
    };

    if (type === 'buying') {
      query = { buyer: req.user.id };
    } else if (type === 'selling') {
      query = { seller: req.user.id };
    }

    if (status) {
      query.status = status;
    }

    const transactions = await Transaction.find(query)
      .populate('product', 'title images')
      .populate('buyer', 'name profilePicture')
      .populate('seller', 'name profilePicture')
      .sort({ transactionDate: -1 });

    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new transaction
router.post('/', protect, async (req, res) => {
  try {
    const { productId, sellerId, price, paymentMethod, notes } = req.body;

    // Check if product exists and is available
    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({ message: 'Product not available' });
    }

    // Check if user is not trying to buy their own product
    if (req.user.id === sellerId) {
      return res.status(400).json({ message: 'Cannot buy your own product' });
    }

    const transaction = new Transaction({
      product: productId,
      buyer: req.user.id,
      seller: sellerId,
      price,
      paymentMethod,
      notes
    });

    await transaction.save();

    // Populate the transaction
    await transaction.populate('product', 'title images');
    await transaction.populate('buyer', 'name profilePicture');
    await transaction.populate('seller', 'name profilePicture');

    res.status(201).json(transaction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update transaction status
router.put('/:id/status', protect, async (req, res) => {
  try {
    const { status } = req.body;
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // Check if user is part of this transaction
    if (transaction.buyer.toString() !== req.user.id && transaction.seller.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    transaction.status = status;
    await transaction.save();

    // Populate the transaction
    await transaction.populate('product', 'title images');
    await transaction.populate('buyer', 'name profilePicture');
    await transaction.populate('seller', 'name profilePicture');

    res.json(transaction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add rating and review
router.post('/:id/review', protect, async (req, res) => {
  try {
    const { rating, review, reviewType } = req.body; // reviewType: 'buyer' or 'seller'
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // Check if user is part of this transaction
    if (transaction.buyer.toString() !== req.user.id && transaction.seller.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (reviewType === 'buyer' && transaction.buyer.toString() === req.user.id) {
      transaction.sellerRating = rating;
      transaction.sellerReview = review;
    } else if (reviewType === 'seller' && transaction.seller.toString() === req.user.id) {
      transaction.buyerRating = rating;
      transaction.buyerReview = review;
    } else {
      return res.status(400).json({ message: 'Invalid review type' });
    }

    await transaction.save();

    // Populate the transaction
    await transaction.populate('product', 'title images');
    await transaction.populate('buyer', 'name profilePicture');
    await transaction.populate('seller', 'name profilePicture');

    res.json(transaction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get specific transaction
router.get('/:id', protect, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('product', 'title images')
      .populate('buyer', 'name profilePicture')
      .populate('seller', 'name profilePicture');

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // Check if user is part of this transaction
    if (transaction.buyer.toString() !== req.user.id && transaction.seller.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(transaction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 