const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'company-seller', 'company-buyer', 'individual'],
    required: true
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  companyDetails: {
    brNumber: { type: String },
    address: { type: String }
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
