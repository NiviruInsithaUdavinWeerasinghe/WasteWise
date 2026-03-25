const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true
  },
  details: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['account_update', 'system_alert', 'transaction'],
    default: 'account_update'
  }
}, { timestamps: true });

module.exports = mongoose.model('AuditLog', auditLogSchema);
