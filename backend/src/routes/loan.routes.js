const express = require('express');
const router  = express.Router();
const { applyForLoan, getLoan } = require('../controllers/loan.controller');
const { validate } = require('../middleware/validate');

// POST /api/v1/loan/apply  → validate input first, then create
router.post('/apply', validate('createLoan'), applyForLoan);

// GET /api/v1/loan/:id  → fetch a specific loan
router.get('/:id', getLoan);

module.exports = router;