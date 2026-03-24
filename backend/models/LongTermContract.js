const mongoose = require('mongoose');

const longTermContractSchema = new mongoose.Schema({
  proposerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  wasteType: {
    type: String,
    required: true
  },
  monthlyQuantityKg: {
    type: Number,
    required: true
  },
  pricePerKg: {
    type: Number,
    required: true
  },
  durationMonths: {
    type: Number,
    required: true
  },
  customTerms: {
    type: String,
    default: ''
  },
  buyerSignatureUrl: {
    type: String,
    default: ''
  },
  sellerSignatureUrl: {
    type: String,
    default: ''
  },
  proposerConfirmed: {
    type: Boolean,
    default: false
  },
  receiverConfirmed: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['draft', 'pending_signature', 'active', 'cancelled'],
    default: 'draft'
  },
  contractPdfUrl: {
    type: String,
    default: ''
  }
}, { timestamps: true });

module.exports = mongoose.model('LongTermContract', longTermContractSchema);
