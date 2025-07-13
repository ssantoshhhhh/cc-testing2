const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Product title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Product description is required']
  },
  category: {
    type: String,
    enum: ['books', 'electronics', 'furniture', 'clothing', 'sports', 'musical-instruments', 'lab-equipment', 'stationery', 'other'],
    required: [true, 'Category is required']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: 0
  },
  originalPrice: {
    type: Number,
    min: 0
  },
  condition: {
    type: String,
    enum: ['new', 'like-new', 'good', 'fair', 'poor'],
    required: [true, 'Condition is required']
  },
  images: [{
    type: String,
    required: [true, 'At least one image is required']
  }],
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Seller is required']
  },
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  contactInfo: {
    phone: {
      type: String,
      required: [true, 'Contact phone is required']
    },
    email: {
      type: String,
      required: [true, 'Contact email is required']
    },
    whatsapp: {
      type: String,
      required: [true, 'WhatsApp number is required']
    },
    preferredContact: {
      type: String,
      enum: ['phone', 'email', 'whatsapp', 'any'],
      default: 'any'
    }
  },
  location: {
    type: String,
    required: [true, 'Location is required']
  },
  tags: [{
    type: String,
    trim: true
  }],
  isNegotiable: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isSold: {
    type: Boolean,
    default: false
  },
  soldAt: {
    type: Date
  },
  soldTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  views: {
    type: Number,
    default: 0
  },
  favorites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // Rating system
  sellerRating: {
    type: Number,
    min: 1,
    max: 5
  },
  buyerRating: {
    type: Number,
    min: 1,
    max: 5
  },
  sellerReview: {
    type: String,
    trim: true
  },
  buyerReview: {
    type: String,
    trim: true
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
  
  if (this.originalPrice !== undefined) {
    this.originalPrice = Number.isInteger(this.originalPrice) ? this.originalPrice : Math.round(this.originalPrice * 100) / 100;
  }
  
  next();
});

module.exports = mongoose.model('Product', productSchema); 