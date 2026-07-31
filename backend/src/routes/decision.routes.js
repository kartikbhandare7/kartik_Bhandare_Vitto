const express = require('express');
const router  = express.Router();
const { makeDecision, getDecision } = require('../controllers/decision.controller');
const rateLimit = require('express-rate-limit');

// Rate limiter: max 20 requests per minute on the decision endpoint
// This prevents abuse of the compute-heavy scoring engine
const decisionLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
  max:      parseInt(process.env.RATE_LIMIT_MAX) || 20,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests. Please wait a minute and try again.',
    });
  },
});

// POST /api/v1/decision/:applicationId  → rate limited, then run engine
router.post('/:applicationId', decisionLimiter, makeDecision);

// GET /api/v1/decision/:applicationId  → fetch existing decision
router.get('/:applicationId', getDecision);

module.exports = router;