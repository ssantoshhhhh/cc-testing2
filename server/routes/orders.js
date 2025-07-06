const express = require('express');
const { body, validationResult } = require('express-validator');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { protect, authorize } = require('../middleware/auth');
const nodemailer = require('nodemailer');

const router = express.Router();

// @route   POST /api/orders
// @desc    Create new order
// @access  Private
router.post('/', [
  protect,
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.product').isMongoId().withMessage('Valid product ID is required'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('rentalDays').isInt({ min: 1 }).withMessage('Rental days must be at least 1'),
  body('deliveryAddress').notEmpty().withMessage('Delivery address is required'),
  body('paymentMethod').isIn(['cash', 'card', 'upi', 'netbanking']).withMessage('Invalid payment method')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { items, rentalDays, notes, deliveryAddress, deliveryInstructions, paymentMethod } = req.body;
    let totalAmount = 0;
    const orderItems = [];

    // Validate each item and calculate total
    for (const item of items) {
      const product = await Product.findById(item.product);
      
      if (!product) {
        return res.status(404).json({ message: `Product ${item.product} not found` });
      }

      if (!product.isActive) {
        return res.status(400).json({ message: `Product ${product.name} is not available` });
      }

      if (product.availableQuantity < item.quantity) {
        return res.status(400).json({ 
          message: `Insufficient quantity for ${product.name}. Available: ${product.availableQuantity}` 
        });
      }

      const itemTotal = product.pricePerDay * item.quantity * rentalDays;
      totalAmount += itemTotal;

      orderItems.push({
        product: product._id,
        quantity: item.quantity,
        pricePerDay: product.pricePerDay,
        totalPrice: itemTotal
      });

      // Update product availability
      product.availableQuantity -= item.quantity;
      await product.save();
    }

    // Calculate startDate and expectedReturnDate
    const startDate = new Date();
    const expectedReturnDate = new Date(startDate);
    expectedReturnDate.setDate(expectedReturnDate.getDate() + rentalDays);

    const order = await Order.create({
      user: req.user.id,
      items: orderItems,
      totalAmount,
      rentalDays,
      startDate,
      expectedReturnDate,
      deliveryAddress,
      deliveryInstructions,
      paymentMethod,
      notes
    });

    await order.populate('items.product');

    // Robust logging for email
    console.log('Attempting to send admin order email for order:', order._id);
    try {
      const user = req.user;
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
        <h2>New Order Placed!</h2>
        <p><b>Order ID:</b> ${order._id}</p>
        <p><b>User:</b> ${user.name} (${user.email})</p>
        <p><b>Delivery Address:</b> ${order.deliveryAddress}</p>
        <p><b>Delivery Instructions:</b> ${order.deliveryInstructions || 'N/A'}</p>
        <p><b>Payment Method:</b> ${order.paymentMethod}</p>
        <p><b>Total Amount:</b> ₹${order.totalAmount}</p>
        <p><b>Placed at:</b> ${order.createdAt}</p>
        <h3>Items:</h3>
        <ul>${itemLines}</ul>
        <p>Please check the admin dashboard for more details.</p>
      `;
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: 'srkrcampusconnect@gmail.com',
        subject: `New Order Placed: #${order._id.toString().slice(-8).toUpperCase()}`,
        text:
`A new order has been placed!\n\nOrder ID: ${order._id}\nUser: ${user.name} (${user.email})\nDelivery Address: ${order.deliveryAddress}\nDelivery Instructions: ${order.deliveryInstructions || 'N/A'}\nPayment Method: ${order.paymentMethod}\nTotal Amount: ₹${order.totalAmount}\n\nItems:\n${order.items.map(item => `- ${item.product.name} (x${item.quantity}) for ${order.rentalDays} days: ₹${item.totalPrice}`).join('\n')}\n\nPlaced at: ${order.createdAt}\n\nPlease check the admin dashboard for more details.`,
        html: htmlBody
      };
      await transporter.sendMail(mailOptions);
      console.log('Admin order email sent to srkrcampusconnect@gmail.com for order:', order._id);
    } catch (mailErr) {
      console.error('Failed to send admin order email for order', order._id, mailErr);
    }

    // Send order confirmation email to user
    try {
      const user = req.user;
      const userMailOptions = {
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: `Order Confirmation: #${order._id.toString().slice(-8).toUpperCase()}`,
        text:
`Dear ${user.name},\n\nThank you for your order!\n\nOrder ID: ${order._id}\nDelivery Address: ${order.deliveryAddress}\nDelivery Instructions: ${order.deliveryInstructions || 'N/A'}\nPayment Method: ${order.paymentMethod}\nTotal Amount: ₹${order.totalAmount}\n\nItems:\n${order.items.map(item => `- ${item.product.name} (x${item.quantity}) for ${order.rentalDays} days: ₹${item.totalPrice}`).join('\n')}\n\nPlaced at: ${order.createdAt}\n\nWe will process your order soon. Thank you for choosing us!`,
        html: `
          <h2>Order Confirmation</h2>
          <p>Dear ${user.name},</p>
          <p>Thank you for your order!</p>
          <p><b>Order ID:</b> ${order._id}</p>
          <p><b>Delivery Address:</b> ${order.deliveryAddress}</p>
          <p><b>Delivery Instructions:</b> ${order.deliveryInstructions || 'N/A'}</p>
          <p><b>Payment Method:</b> ${order.paymentMethod}</p>
          <p><b>Total Amount:</b> ₹${order.totalAmount}</p>
          <p><b>Placed at:</b> ${order.createdAt}</p>
          <h3>Items:</h3>
          <ul>${order.items.map(item => `<li><b>${item.product.name}</b> (x${item.quantity}) for ${order.rentalDays} days: ₹${item.totalPrice}</li>`).join('')}</ul>
          <p>We will process your order soon. Thank you for choosing us!</p>
        `
      };
      await transporter.sendMail(userMailOptions);
      console.log('Order confirmation email sent to user:', user.email, 'for order:', order._id);
    } catch (userMailErr) {
      console.error('Failed to send order confirmation email to user for order', order._id, userMailErr);
    }

    res.status(201).json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/orders
// @desc    Get user orders
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { status, limit = 10, page = 1 } = req.query;
    
    let query = { user: req.user.id };
    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const orders = await Order.find(query)
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

// @route   GET /api/orders/:id
// @desc    Get single order
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.product')
      .populate('user', 'name email studentId department');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if user owns this order or is admin
    if (order.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view this order' });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/orders/:id/return
// @desc    Return items
// @access  Private
router.put('/:id/return', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.product');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if user owns this order or is admin
    if (order.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to return this order' });
    }

    if (order.status === 'returned') {
      return res.status(400).json({ message: 'Order already returned' });
    }

    // Calculate penalty if overdue
    let penaltyAmount = 0;
    let penaltyDays = 0;
    
    if (new Date() > order.expectedReturnDate) {
      penaltyDays = Math.ceil((new Date() - order.expectedReturnDate) / (1000 * 60 * 60 * 24));
      penaltyAmount = penaltyDays * 50; // $50 per day penalty
    }

    // Update order
    order.status = 'returned';
    order.actualReturnDate = new Date();
    order.penaltyAmount = penaltyAmount;
    order.penaltyDays = penaltyDays;

    // Return items to inventory
    for (const item of order.items) {
      const product = await Product.findById(item.product._id);
      if (product) {
        product.availableQuantity += item.quantity;
        await product.save();
      }
    }

    await order.save();

    res.json({
      success: true,
      data: order,
      penalty: {
        days: penaltyDays,
        amount: penaltyAmount
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/orders/:id/cancel
// @desc    Cancel order (User only, within 10 minutes)
// @access  Private
router.put('/:id/cancel', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.product');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if user owns this order
    if (order.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to cancel this order' });
    }

    // Check if order can be cancelled
    if (!order.canBeCancelled) {
      return res.status(400).json({ 
        message: 'Order cannot be cancelled. Orders can only be cancelled within 10 minutes of placement and must be in pending status.',
        remainingTime: order.remainingCancelTime
      });
    }

    // Update order status and set cancelled by user
    order.status = 'cancelled';
    order.cancelledBy = 'user';
    await order.save();

    // Return items to inventory
    for (const item of order.items) {
      const product = await Product.findById(item.product._id);
      if (product) {
        product.availableQuantity += item.quantity;
        await product.save();
      }
    }

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      data: order
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/orders/:id/status
// @desc    Update order status (Admin only)
// @access  Private/Admin
router.put('/:id/status', [
  protect,
  authorize('admin'),
  body('status').isIn(['pending', 'confirmed', 'rented', 'returned', 'overdue', 'cancelled'])
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

// @route   GET /api/orders/overdue/check
// @desc    Check for overdue orders
// @access  Private
router.get('/overdue/check', protect, async (req, res) => {
  try {
    const overdueOrders = await Order.find({
      user: req.user.id,
      status: { $in: ['confirmed', 'rented'] },
      expectedReturnDate: { $lt: new Date() }
    }).populate('items.product');

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

// @route   GET /api/orders/stats/user
// @desc    Get user order statistics
// @access  Private
router.get('/stats/user', protect, async (req, res) => {
  try {
    const stats = await Order.aggregate([
      { $match: { user: req.user._id } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: '$totalAmount' },
          totalPenalty: { $sum: '$penaltyAmount' },
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

    res.json({
      success: true,
      data: stats[0] || {
        totalOrders: 0,
        totalSpent: 0,
        totalPenalty: 0,
        activeRentals: 0,
        overdueRentals: 0
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 