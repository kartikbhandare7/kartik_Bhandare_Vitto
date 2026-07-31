const mongoose = require('mongoose');

const decisionSchema = new mongoose.Schema({
  applicationId: {
    type: String,
    required: true,
    index: true,
  },
  profileId: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['APPROVED', 'REJECTED'],
    required: true,
  },
  creditScore: {
    type: Number,
    min: 300,
    max: 850,
    required: true,
  },
  reasonCodes: {
    type: [String],
    required: true,
  },
  breakdown: {
    revenueEmiRatio:       Number,
    loanToRevenueMultiple: Number,
    tenureRiskScore:       Number,
    businessTypeScore:     Number,
    fraudCheckScore:       Number,
    weightedTotal:         Number,
  },
  inputs: {
    monthlyRevenue:        Number,
    loanAmount:            Number,
    tenureMonths:          Number,
    businessType:          String,
    emi:                   Number,
  },
  processingTimeMs: Number,
}, {
  timestamps: true,
});

module.exports = mongoose.model('Decision', decisionSchema);