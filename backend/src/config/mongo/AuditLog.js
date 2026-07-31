const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  event: {
    type: String,
    enum: [
      'PROFILE_CREATED',
      'APPLICATION_SUBMITTED',
      'DECISION_REQUESTED',
      'DECISION_COMPLETED',
      'VALIDATION_FAILED',
      'RATE_LIMIT_HIT',
    ],
    required: true,
  },
  applicationId: String,
  profileId:     String,
  payload:       mongoose.Schema.Types.Mixed,
  result:        mongoose.Schema.Types.Mixed,
  ip:            String,
  userAgent:     String,
  durationMs:    Number,
  error:         String,
}, {
  timestamps: true,
});

// Auto-delete logs older than 90 days
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

module.exports = mongoose.model('AuditLog', auditLogSchema);