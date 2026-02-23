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

module.exports = {
  createListing,
  getAllActiveListings,
  getSellerListings
};
