const mongoose = require('mongoose');

const buyRequestSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product is required']
  },
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Buyer is required']
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Seller is required']
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'completed'],
    default: 'pending'
  },
  message: {
    type: String,
    trim: true,
    maxlength: 500
  },
  offeredPrice: {
    type: Number,
    min: 0
  },
  isNegotiable: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  // Timestamps for different status changes
  acceptedAt: {
    type: Date
  },
  rejectedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  }
});

// Update the updatedAt field before saving
buyRequestSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Handle price precision
  if (this.offeredPrice !== undefined) {
    this.offeredPrice = Number.isInteger(this.offeredPrice) ? this.offeredPrice : Math.round(this.offeredPrice * 100) / 100;
  }
  
  next();
});

// Prevent multiple pending requests from same buyer for same product
buyRequestSchema.index({ product: 1, buyer: 1, status: 1 }, { unique: true });

module.exports = mongoose.model('BuyRequest', buyRequestSchema); 