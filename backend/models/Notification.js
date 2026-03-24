const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['outbid', 'ending_soon', 'certificate', 'auction_won', 'auction_sold', 'auction_ended_empty', 'agreement_created', 'payment_received', 'auction_lost', 'payment_defaulted', 'admin_alert', 'contract_proposed', 'contract_signed', 'contract_established'],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  relatedEntityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false
  }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
