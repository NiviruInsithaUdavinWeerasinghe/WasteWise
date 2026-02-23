const Listing = require('../models/Listing');

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
      status
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
      status: status || 'active'
    });

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
    const listings = await Listing.find({ status: 'active' }).populate('sellerId', 'name email role');
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
    const listings = await Listing.find({ sellerId }).sort({ createdAt: -1 });
    
    res.status(200).json(listings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching seller listings' });
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

    // Calculate the current highest bid
    const currentHighestBid = listing.bids.length > 0
      ? Math.max(...listing.bids.map(b => b.amount))
      : listing.startingBid || 0;

    if (amount <= currentHighestBid) {
      return res.status(400).json({ 
        message: `Bid must be strictly greater than the current highest bid of ${currentHighestBid}` 
      });
    }

    // Add bid to history array
    listing.bids.push({
      userId,
      amount
    });

    await listing.save();

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

module.exports = {
  createListing,
  getAllActiveListings,
  getSellerListings,
  placeBid
};
