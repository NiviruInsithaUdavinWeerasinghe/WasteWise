const express = require('express');
const router = express.Router();
const { downloadAgreement } = require('../controllers/listingController');
const { protect } = require('../middleware/authMiddleware');

// @route   GET /api/agreements/:listingId/download
// @desc    Download Digital Trade Agreement PDF
// @access  Private
router.get('/:listingId/download', protect, downloadAgreement);

module.exports = router;
