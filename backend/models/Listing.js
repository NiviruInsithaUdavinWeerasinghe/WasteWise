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
    enum: ['active', 'sold'],
    default: 'active',
    required: true
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
