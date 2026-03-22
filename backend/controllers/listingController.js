const Listing = require('../models/Listing');
const User = require('../models/User');
const { sendNotification } = require('./notificationController');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy');

// @desc    Create a listing
// @route   POST /api/listings
// @access  Private (Sellers only usually, but let's assume auth middleware handles it)
const createListing = async (req, res) => {
  try {
    const {
      wasteType,
      weight,
      condition,
      location,
      sellingMethod,
      price,
      startingBid,
      status,
      imageUrl
    } = req.body;

    // The user ID comes from the protect middleware
    const sellerId = req.user.id;
    const userRole = req.user.role;
    const isApproved = req.user.isApproved;

    if (userRole === 'company-seller' && !isApproved) {
      return res.status(403).json({ message: 'Your account is pending admin approval. You cannot create listings yet.' });
    }

    if (!wasteType || !weight || !condition || !location || !sellingMethod) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    if (sellingMethod === 'direct' && price === undefined) {
      return res.status(400).json({ message: 'Direct sales require a price' });
    }

    if (sellingMethod === 'auction' && startingBid === undefined) {
      return res.status(400).json({ message: 'Auctions require a starting bid' });
    }

    const listing = await Listing.create({
      sellerId,
      wasteType,
      weight,
      condition,
      location,
      sellingMethod,
      price,
      startingBid,
      status: status || 'active',
      description: req.body.description,
      minBidIncrease: req.body.minBidIncrease || 0,
      endTime: req.body.endTime,
      imageUrl
    });

    // Automatically generate a "Green Certificate" alert
    await sendNotification(
      sellerId,
      'certificate',
      `Congratulations! A Green Certificate for your ${weight}kg upload of "${wasteType}" has been successfully generated and recorded.`,
      listing._id
    );

    res.status(201).json(listing);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error creating listing' });
  }
};

// @desc    Get all active listings
// @route   GET /api/listings
// @access  Public or Private depending on requirements, let's assume public or logged-in users
const getAllActiveListings = async (req, res) => {
  try {
    const listings = await Listing.find({ status: 'active' })
      .populate('sellerId', 'name email role')
      .populate('bids.userId', 'name email');
    res.status(200).json(listings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching listings' });
  }
};

// @desc    Get listings for a specific seller
// @route   GET /api/listings/seller/:id
// @access  Private
const getSellerListings = async (req, res) => {
  try {
    const sellerId = req.params.id;
    const listings = await Listing.find({ sellerId })
      .populate('bids.userId', 'name email')
      .sort({ createdAt: -1 });
    
    res.status(200).json(listings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching seller listings' });
  }
};

// @desc    Get listings where the buyer has placed bids
// @route   GET /api/listings/buyer/bids
// @access  Private
const getBuyerBids = async (req, res) => {
  try {
    const userId = req.user.id;
    const listings = await Listing.find({ 'bids.userId': userId })
      .populate('sellerId', 'name email role')
      .populate('bids.userId', 'name email')
      .sort({ createdAt: -1 });
      
    res.status(200).json(listings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching buyer bids' });
  }
};

// @desc    Place a bid on a listing
// @route   POST /api/listings/:id/bid
// @access  Private
const placeBid = async (req, res) => {
  try {
    const listingId = req.params.id;
    const { amount } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Block sellers from bidding
    if (userRole === 'company-seller') {
      return res.status(403).json({ message: 'Sellers are not allowed to place bids' });
    }

    const listing = await Listing.findById(listingId);

    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    if (listing.sellingMethod !== 'auction') {
      return res.status(400).json({ message: 'This item is not for auction' });
    }

    if (listing.status !== 'active') {
      return res.status(400).json({ message: 'This auction is closed' });
    }

    // Calculate the current highest bid and bidder
    const currentHighestBidObj = listing.bids.length > 0 
      ? listing.bids.reduce((prev, current) => (prev.amount > current.amount) ? prev : current)
      : null;
    const currentHighestBid = currentHighestBidObj ? currentHighestBidObj.amount : (listing.startingBid || 0);
    const requiredMin = currentHighestBidObj ? (currentHighestBid + (listing.minBidIncrease || 0)) : currentHighestBid;

    if (amount < requiredMin) {
      return res.status(400).json({ 
        message: `Bid must be at least ${requiredMin} LKR` 
      });
    }

    // Add bid to history array
    listing.bids.push({
      userId,
      amount
    });

    await listing.save();

    // Auto-add listing to the bidder's watchlist
    const user = await User.findById(userId);
    if (user && !user.watchlist.includes(listingId)) {
      user.watchlist.push(listingId);
      await user.save();
    }

    // Trigger Outbid Notification to previous highest bidder
    if (currentHighestBidObj && currentHighestBidObj.userId.toString() !== userId.toString()) {
      await sendNotification(
        currentHighestBidObj.userId,
        'outbid',
        `You have been outbid on "${listing.wasteType}". The new highest bid is LKR ${amount}.`,
        listing._id
      );
    }

    res.status(200).json({
      message: 'Bid placed successfully',
      currentHighestBid: amount,
      bidsCount: listing.bids.length
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error placing bid' });
  }
};

// @desc    Complete payment for a won auction
// @route   POST /api/listings/:id/pay
// @access  Private
const completePayment = async (req, res) => {
  try {
    const listingId = req.params.id;
    const listing = await Listing.findById(listingId);
    
    let buyerId = req.user?.id;
    if (!buyerId && listing && listing.sellingMethod === 'auction' && listing.bids && listing.bids.length > 0) {
      const highestBid = listing.bids.reduce((prev, current) => (prev.amount > current.amount) ? prev : current);
      buyerId = highestBid.userId;
    }

    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    if (listing.status !== 'active' && listing.status !== 'pending_payment') {
      return res.status(400).json({ message: 'This item is no longer available for payment' });
    }

    // Determine the final amount (if auction, use highest bid; if direct, use price)
    let finalAmount = 0;
    if (listing.sellingMethod === 'auction') {
      if (listing.bids.length === 0) {
        return res.status(400).json({ message: 'No bids placed on this auction' });
      }
      finalAmount = Math.max(...listing.bids.map(b => b.amount));
    } else {
      finalAmount = listing.price;
    }

    // Stripe Commission Logic (3% platform fee)
    const commission = finalAmount * 0.03;
    const sellerTransfer = finalAmount - commission;

    console.log(`[Stripe Simulation] Processing payment of LKR ${finalAmount}`);
    console.log(`[Stripe Simulation] Platform Commission (3%): LKR ${commission}`);
    console.log(`[Stripe Simulation] Transferring to Seller: LKR ${sellerTransfer}`);

    // Create a PaymentIntent with the final amount multiplied by 100
    let paymentIntentId = `pi_simulated_${Date.now()}`;
    let clientSecret = `sec_simulated_${Date.now()}`;
    
    // Bypassing Stripe actual API request to prevent crashing on dummy keys
    console.log('[Stripe Simulation] Using fallback ID due to dummy secret key.');

    // Instantiate Agreement
    const Agreement = require('../models/Agreement');
    const agreement = new Agreement({
      buyerId,
      sellerId: listing.sellerId,
      listingId: listing._id,
      finalPrice: finalAmount,
      commissionDeduced: commission,
      pickupResponsibility: listing.pickupResponsibility || 'Buyer Arranges Pickup'
    });
    await agreement.save();

    listing.status = 'sold';
    listing.paymentIntentId = paymentIntentId;
    await listing.save();

    // Fire SLA Notification
    await sendNotification(
      buyerId,
      'agreement_created',
      `Payment successful. A Digital Trade Agreement (SLA) has been generated.`,
      listing._id
    );
    await sendNotification(
      listing.sellerId,
      'agreement_created',
      `Payment received! The Digital Trade Agreement (SLA) has been generated for your listing.`,
      listing._id
    );

    res.status(200).json({
      message: 'Payment completed successfully',
      clientSecret: clientSecret,
      paymentIntentId: paymentIntentId,
      totalAmount: finalAmount,
      platformFee: commission,
      sellerTransfer: sellerTransfer,
      status: listing.status
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error processing payment' });
  }
};

// @desc    Get all failed payment listings
// @route   GET /api/listings/failed
// @access  Private (Admin only)
const getFailedTransactions = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admins only.' });
    }
    const listings = await Listing.find({ status: 'failed_payment' })
      .populate('sellerId', 'name email role')
      .populate('bids.userId', 'name email role');
    res.status(200).json(listings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching failed transactions' });
  }
};

module.exports = {
  createListing,
  getAllActiveListings,
  getSellerListings,
  getBuyerBids,
  placeBid,
  completePayment,
  getFailedTransactions
};
