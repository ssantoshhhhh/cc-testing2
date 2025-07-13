const express = require('express');
const router = express.Router();
const BuyRequest = require('../models/BuyRequest');
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');
const { sendBuyRequestNotification, sendBuyRequestStatusNotification } = require('../utils/emailService');

// Get all buy requests for a user (as buyer or seller)
router.get('/', protect, async (req, res) => {
  try {
    const requests = await BuyRequest.find({
      $or: [{ buyer: req.user.id }, { seller: req.user.id }]
    })
    .populate('product', 'title images price')
    .populate('buyer', 'name profilePicture email')
    .populate('seller', 'name profilePicture email')
    .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error('Error fetching buy requests:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get buy requests for a specific product
router.get('/product/:productId', protect, async (req, res) => {
  try {
    const requests = await BuyRequest.find({
      product: req.params.productId,
      seller: req.user.id
    })
    .populate('product', 'title images price')
    .populate('buyer', 'name profilePicture email')
    .populate('seller', 'name profilePicture email')
    .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error('Error fetching product buy requests:', error);
    res.status(500).json({ message: error.message });
  }
});

// Create a new buy request
router.post('/', protect, async (req, res) => {
  try {
    const { productId, message, offeredPrice, isNegotiable } = req.body;

    // Get the product to find the seller
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Prevent buying your own product
    if (product.seller.toString() === req.user.id) {
      return res.status(400).json({ message: 'You cannot buy your own product' });
    }

    // Check if product is already sold
    if (product.isSold) {
      return res.status(400).json({ message: 'This product is already sold' });
    }

    // Check if there's already a pending request from this buyer
    const existingRequest = await BuyRequest.findOne({
      product: productId,
      buyer: req.user.id,
      status: 'pending'
    });

    if (existingRequest) {
      return res.status(400).json({ message: 'You already have a pending request for this product' });
    }

    // Create the buy request
    const buyRequest = new BuyRequest({
      product: productId,
      buyer: req.user.id,
      seller: product.seller,
      message: message || '',
      offeredPrice: offeredPrice || product.price,
      isNegotiable: isNegotiable || false
    });

    await buyRequest.save();

    // Populate the request
    await buyRequest.populate('product', 'title images price');
    await buyRequest.populate('buyer', 'name profilePicture email');
    await buyRequest.populate('seller', 'name profilePicture email');

    // Send email notification to seller
    try {
      const requestUrl = `${process.env.CLIENT_URL}/buy-requests`;
      await sendBuyRequestNotification(
        buyRequest.seller.email,
        buyRequest.seller.name,
        buyRequest.buyer.name,
        buyRequest.product.title,
        buyRequest.offeredPrice,
        buyRequest.message,
        requestUrl
      );
    } catch (emailError) {
      console.error('Failed to send buy request notification:', emailError);
    }

    res.status(201).json(buyRequest);
  } catch (error) {
    console.error('Error creating buy request:', error);
    res.status(500).json({ message: error.message });
  }
});

// Update buy request status (accept/reject/complete)
router.put('/:requestId/status', protect, async (req, res) => {
  try {
    const { status } = req.body;
    const buyRequest = await BuyRequest.findById(req.params.requestId)
      .populate('product', 'title images price')
      .populate('buyer', 'name profilePicture email')
      .populate('seller', 'name profilePicture email');

    if (!buyRequest) {
      return res.status(404).json({ message: 'Buy request not found' });
    }

    // Only seller can update status
    if (buyRequest.seller._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only seller can update request status' });
    }

    // Update status and timestamp
    buyRequest.status = status;
    if (status === 'accepted') {
      buyRequest.acceptedAt = new Date();
    } else if (status === 'rejected') {
      buyRequest.rejectedAt = new Date();
    } else if (status === 'completed') {
      buyRequest.completedAt = new Date();
      
      // Mark product as sold
      const product = await Product.findById(buyRequest.product._id);
      if (product) {
        product.isSold = true;
        product.soldAt = new Date();
        product.soldTo = buyRequest.buyer._id;
        product.buyer = buyRequest.buyer._id;
        await product.save();
      }
    }

    await buyRequest.save();

    // Send email notification to buyer
    try {
      const requestUrl = `${process.env.CLIENT_URL}/buy-requests`;
      await sendBuyRequestStatusNotification(
        buyRequest.buyer.email,
        buyRequest.buyer.name,
        buyRequest.seller.name,
        buyRequest.product.title,
        status,
        requestUrl
      );
    } catch (emailError) {
      console.error('Failed to send status notification:', emailError);
    }

    res.json(buyRequest);
  } catch (error) {
    console.error('Error updating buy request status:', error);
    res.status(500).json({ message: error.message });
  }
});

// Delete a buy request (only by the buyer who created it)
router.delete('/:requestId', protect, async (req, res) => {
  try {
    const buyRequest = await BuyRequest.findById(req.params.requestId);

    if (!buyRequest) {
      return res.status(404).json({ message: 'Buy request not found' });
    }

    // Only buyer can delete their own request
    if (buyRequest.buyer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can only delete your own requests' });
    }

    // Only pending requests can be deleted
    if (buyRequest.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending requests can be deleted' });
    }

    await buyRequest.deleteOne();
    res.json({ message: 'Buy request deleted successfully' });
  } catch (error) {
    console.error('Error deleting buy request:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 