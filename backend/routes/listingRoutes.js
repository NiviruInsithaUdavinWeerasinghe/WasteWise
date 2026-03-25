const express = require('express');
const router = express.Router();
const {
  createListing,
  getAllActiveListings,
  getSellerListings,
  placeBid,
  completePayment,
  getBuyerBids,
  getFailedTransactions,
  confirmReceipt,
  getCertificate,
  getListingById
} = require('../controllers/listingController');
const { protect, admin } = require('../middleware/authMiddleware');

// Route to get all active listings
router.get('/', getAllActiveListings);
router.get('/failed', protect, admin, getFailedTransactions);
router.get('/:id', getListingById);

// Route to get listings where the buyer has placed a bid
router.get('/buyer/bids', protect, getBuyerBids);

// Route to create a new listing (protected)
router.post('/', protect, createListing);

// Route to place a bid on an auction (protected)
router.post('/:id/bid', protect, placeBid);

// Route to complete payment for a listing (protected)
router.post('/:id/pay', protect, completePayment);

// Route to get listings for a specific seller
router.get('/seller/:id', protect, getSellerListings);

// Route to confirm receipt of waste (protected)
router.post('/:id/confirm-receipt', protect, confirmReceipt);

// Route to download Green Certificate PDF (protected)
router.get('/:id/certificate', protect, getCertificate);

module.exports = router;
