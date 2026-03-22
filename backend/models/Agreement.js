const mongoose = require('mongoose');

const agreementSchema = new mongoose.Schema({
  buyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  listingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Listing',
    required: true
  },
  finalPrice: {
    type: Number,
    required: true
  },
  commissionDeduced: {
    type: Number,
    required: true
  },
  pickupResponsibility: {
    type: String,
    enum: ['Buyer Arranges Pickup', 'Seller Delivers', 'Platform Logistics'],
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Agreement', agreementSchema);
