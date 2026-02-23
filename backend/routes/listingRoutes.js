const express = require('express');
const router = express.Router();
const {
  createListing,
  getAllActiveListings,
  getSellerListings
} = require('../controllers/listingController');
const { protect } = require('../middleware/authMiddleware');

// Route to get all active listings
router.get('/', getAllActiveListings);

// Route to create a new listing (protected)
router.post('/', protect, createListing);

// Route to get listings for a specific seller
router.get('/seller/:id', protect, getSellerListings);

module.exports = router;
