const express = require('express');
const router = express.Router();
const {
  createListing,
  getAllActiveListings,
  getSellerListings,
  placeBid,
  completePayment,
  getBuyerBids,
  getFailedTransactions
} = require('../controllers/listingController');
const { protect } = require('../middleware/authMiddleware');

// Route to get all active listings
router.get('/', getAllActiveListings);

// Route to get listings where the buyer has placed a bid
router.get('/buyer/bids', protect, getBuyerBids);

// Route to get all failed test payments (Admin)
router.get('/failed', protect, getFailedTransactions);

// Route to create a new listing (protected)
router.post('/', protect, createListing);

// Route to place a bid on an auction (protected)
router.post('/:id/bid', protect, placeBid);

// Route to complete payment for a listing (protected)
router.post('/:id/pay', protect, completePayment);

// Route to get listings for a specific seller
router.get('/seller/:id', protect, getSellerListings);

module.exports = router;
