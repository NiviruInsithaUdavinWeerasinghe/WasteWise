const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema({
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  wasteType: {
    type: String,
    required: true
  },
  imageUrl: {
    type: String,
    required: false
  },
  weight: {
    type: Number,
    required: true
  },
  condition: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  sellingMethod: {
    type: String,
    enum: ['direct', 'auction'],
    required: true
  },
  price: {
    type: Number
  },
  startingBid: {
    type: Number
  },
    status: {
    type: String,
    enum: ['active', 'sold', 'pending_payment', 'failed_payment', 'expired', 'no_bids'],
    default: 'active',
    required: true
  },
  pickupResponsibility: {
    type: String,
    enum: ['Buyer Arranges Pickup', 'Seller Delivers', 'Platform Logistics'],
    required: true,
    default: 'Buyer Arranges Pickup'
  },
  minBidIncrease: {
    type: Number,
    default: 0
  },
  description: {
    type: String,
    trim: true
  },
  endTime: {
    type: Date
  },
  paymentDeadline: {
    type: Date
  },
  paymentIntentId: {
    type: String
  },
  bids: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Listing', listingSchema);
