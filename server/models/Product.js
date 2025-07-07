const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Product description is required']
  },
  category: {
    type: String,
    enum: ['mini-drafter', 'lab-apron'],
    required: [true, 'Category is required']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: 0
  },
  pricePerDay: {
    type: Number,
    required: [true, 'Price per day is required'],
    min: 0
  },
  totalQuantity: {
    type: Number,
    required: [true, 'Total quantity is required'],
    min: 0
  },
  availableQuantity: {
    type: Number,
    required: [true, 'Available quantity is required'],
    min: 0
  },
  images: [{
    type: String,
    required: [true, 'At least one image is required']
  }],
  specifications: {
    type: Map,
    of: String
  },
  condition: {
    type: String,
    enum: ['new', 'good', 'fair', 'poor'],
    default: 'good'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
productSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Handle price precision to avoid floating point issues
  if (this.price !== undefined) {
    this.price = Number.isInteger(this.price) ? this.price : Math.round(this.price * 100) / 100;
  }
  
  if (this.pricePerDay !== undefined) {
    this.pricePerDay = Number.isInteger(this.pricePerDay) ? this.pricePerDay : Math.round(this.pricePerDay * 100) / 100;
  }
  
  next();
});

module.exports = mongoose.model('Product', productSchema); 