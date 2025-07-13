const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  studentId: {
    type: String,
    required: [true, 'Student ID is required'],
    unique: true
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required']
  },
  department: {
    type: String,
    required: false
  },
  address: {
    type: String,
    required: false
  },
  // Profile picture field
  profilePicture: {
    data: {
      type: Buffer,
      default: null
    },
    contentType: {
      type: String,
      default: null
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Registration OTP fields
  registrationOTP: String,
  registrationOTPExpire: Date,
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  // Account deletion OTP fields
  deleteAccountOTP: String,
  deleteAccountOTPExpire: Date,
  // Seller profile fields
  isSeller: {
    type: Boolean,
    default: false
  },
  sellerRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalSales: {
    type: Number,
    default: 0
  },
  totalTransactions: {
    type: Number,
    default: 0
  },
  sellerDescription: {
    type: String,
    trim: true
  },
  // Buyer profile fields
  buyerRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalPurchases: {
    type: Number,
    default: 0
  },
  totalSpent: {
    type: Number,
    default: 0
  },
  // Rating counts for averaging
  sellerRatingCount: {
        type: Number,
    default: 0
      },
  buyerRatingCount: {
        type: Number,
    default: 0
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  resetPasswordOTP: String,
  resetPasswordOTPExpire: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Encrypt password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema); 