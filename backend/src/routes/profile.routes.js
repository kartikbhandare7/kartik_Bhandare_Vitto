const express = require('express');
const router  = express.Router();
const { createProfile, getProfile } = require('../controllers/profile.controller');
const { validate } = require('../middleware/validate');

// POST /api/v1/profile  → validate input first, then create
router.post('/', validate('createProfile'), createProfile);

// GET /api/v1/profile/:id  → fetch profile + its applications
router.get('/:id', getProfile);

module.exports = router;