const Listing = require('../models/Listing');
const User = require('../models/User');
const Agreement = require('../models/Agreement');
const { sendNotification } = require('./notificationController');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy');
const crypto = require('crypto');
const PDFDocument = require('pdfkit');

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

const completePayment = async (req, res) => {
  try {
    const listingId = req.params.id;
    const listing = await Listing.findById(listingId);
    
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    const currentUserId = req.user.id;

    // 1. Validation for Auctions
    if (listing.sellingMethod === 'auction') {
      // Must be in pending_payment status (auction ended via cron)
      if (listing.status !== 'pending_payment') {
        return res.status(400).json({ 
          message: listing.status === 'active' 
            ? 'This auction is still active. Please wait for it to end.' 
            : 'This auction is no longer available for payment.' 
        });
      }

      // Must have bids
      if (!listing.bids || listing.bids.length === 0) {
        return res.status(400).json({ message: 'No bids placed on this auction.' });
      }

      // MUST be the winner
      const highestBid = listing.bids.reduce((prev, current) => (prev.amount > current.amount) ? prev : current);
      const winnerId = highestBid.userId.toString();

      if (currentUserId !== winnerId) {
        return res.status(403).json({ 
          message: 'Access denied. Only the auction winner can complete this payment.' 
        });
      }

      var buyerId = winnerId;
      var finalAmount = highestBid.amount;

    } else {
      // 2. Validation for Direct Sales
      if (listing.status !== 'active') {
        return res.status(400).json({ message: 'This item is no longer available for purchase.' });
      }
      
      var buyerId = currentUserId;
      var finalAmount = listing.price;
    }

    // Stripe Commission Logic (3% platform fee)
    const commission = finalAmount * 0.03;
    const sellerTransfer = finalAmount - commission;

    console.log(`[Stripe Simulation] Processing payment of LKR ${finalAmount} for Listing ${listingId}`);
    console.log(`[Stripe Simulation] Payer: ${currentUserId}`);

    // Create a PaymentIntent simulation
    let paymentIntentId = `pi_simulated_${Date.now()}`;
    let clientSecret = `sec_simulated_${Date.now()}`;

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

const path = require('path');
const LOGO_PATH = path.join(__dirname, '../../app/src/assets/logo(v2.2).png');

/**
 * Shared helper to draw a premium Green Certificate
 */
const drawCertificate = (doc, data) => {
  const { sellerName, buyerName, wasteType, weight, co2Saved, date, hash, listingId } = data;

  // --- Background & Border ---
  doc.rect(0, 0, 612, 792).fill('#ffffff'); // White background
  
  // Subtle light green header bar
  doc.rect(0, 0, 612, 120).fill('#f0fdf4'); // Very light green
  
  // Formal Border
  doc.rect(40, 40, 532, 712).lineWidth(1.5).stroke('#d1d5db');
  doc.rect(45, 45, 522, 702).lineWidth(0.5).stroke('#16a34a'); // Thin green inner border

  // --- Header ---
  try {
    doc.image(LOGO_PATH, 60, 60, { width: 80 });
  } catch (err) {
    console.warn("Logo not found, skipping image.");
  }

  doc.fillColor('#16a34a');
  doc.fontSize(16).font('Helvetica-Bold').text('WasteWise Platform', 160, 75);
  doc.fillColor('#6b7280');
  doc.fontSize(9).font('Helvetica').text('Official Sustainability Verification Service', 160, 95);

  // --- Main Title ---
  doc.moveDown(5);
  doc.fillColor('#111827');
  doc.fontSize(24).font('Helvetica-Bold').text('GREEN CERTIFICATE', { align: 'center' });
  doc.moveDown(0.2);
  doc.fontSize(10).font('Helvetica').fillColor('#6b7280').text('Issued for Industrial Waste Diversion Compliance', { align: 'center' });
  
  doc.moveDown(1.5);
  doc.rect(150, doc.y, 312, 1).fill('#e5e7eb');
  doc.moveDown(2);

  // --- Certification Statement ---
  doc.fillColor('#374151');
  doc.fontSize(11).font('Helvetica').text('This document serves as formal verification that the following member organization:', { align: 'center' });
  doc.moveDown(1);
  doc.fillColor('#16a34a');
  doc.fontSize(20).font('Helvetica-Bold').text(sellerName.toUpperCase(), { align: 'center' });
  doc.moveDown(1);
  doc.fillColor('#374151');
  doc.fontSize(11).font('Helvetica').text('has successfully completed a sustainable waste management transaction via the WasteWise circular supply chain network.', { align: 'center', width: 400, indent: 60 });

  // --- Technical Details / Table ---
  doc.moveDown(3);
  const startX = 100;
  const labelWidth = 180;
  const valueX = startX + labelWidth + 20;
  let currentY = doc.y;

  const drawDetail = (label, value) => {
    doc.fillColor('#6b7280').fontSize(9).font('Helvetica-Bold').text(label.toUpperCase(), startX, currentY);
    doc.fillColor('#111827').fontSize(11).font('Helvetica').text(value, valueX, currentY);
    currentY += 25;
    // Subtle separator line
    doc.rect(startX, currentY - 8, 412, 0.5).fill('#f3f4f6');
  };

  drawDetail('Material Diverted', `${weight} KG of ${wasteType}`);
  drawDetail('Verified Recipient', buyerName);
  drawDetail('Certification Date', date);
  drawDetail('Audit Reference ID', listingId);

  // --- Impact Summary ---
  currentY += 20;
  doc.rect(startX, currentY, 412, 60).fill('#f9fafb');
  doc.fillColor('#16a34a').fontSize(10).font('Helvetica-Bold').text('ENVIRONMENTAL IMPACT SUMMARY', startX + 20, currentY + 15);
  doc.fillColor('#111827').fontSize(14).font('Helvetica-Bold').text(`${co2Saved.toFixed(2)} KG CO2e AVOIDED`, startX + 20, currentY + 32);

  // --- Verification Footer ---
  doc.fillColor('#9ca3af');
  doc.fontSize(8).font('Helvetica-Bold').text('BLOCKCHAIN VERIFICATION HASH', 60, 680);
  doc.fillColor('#16a34a');
  doc.fontSize(7).font('Courier').text(hash, 60, 692, { width: 492 });

  // Footer Disclaimer
  doc.fillColor('#9ca3af');
  doc.fontSize(7).font('Helvetica').text('This certificate is a digital record of sustainability verified by the WasteWise circular economy protocol. It is legally binding between the participating parties as a record of environmental compliance.', 60, 730, { align: 'center', width: 492 });
};

// @desc    Confirm receipt of waste and generate Green Certificate
// @route   POST /api/listings/:id/confirm-receipt
// @access  Private (Buyer)
const confirmReceipt = async (req, res) => {
  try {
    const listingId = req.params.id;
    const listing = await Listing.findById(listingId).populate('sellerId', 'name email');
    
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    if (listing.status !== 'sold' && listing.status !== 'paid') {
      return res.status(400).json({ message: 'Listing must be in "sold" or "paid" status to confirm receipt.' });
    }

    // Calculate CO2 Saved
    const CO2_SAVED = listing.weight * 15.6;

    // Generate SHA-256 Hash
    const verificationData = `${listing._id}-${listing.sellerId._id}-${listing.weight}-${Date.now()}`;
    const hash = crypto.createHash('sha256').update(verificationData).digest('hex');

    // Update Listing
    listing.status = 'completed';
    listing.carbonSaved = CO2_SAVED;
    listing.verificationId = hash;
    await listing.save();

    // Find Agreement to get Buyer Name
    const agreement = await Agreement.findOne({ listingId: listing._id }).populate('buyerId', 'name email');
    const buyerName = agreement?.buyerId?.name || 'Verified Buyer';

    // Generate PDF in memory
    const doc = new PDFDocument({ margin: 0, size: 'LETTER' });
    let buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    
    // Create a promise to handle PDF completion
    const pdfBuffer = await new Promise((resolve, reject) => {
      doc.on('end', () => {
        resolve(Buffer.concat(buffers));
      });
      doc.on('error', reject);

      drawCertificate(doc, {
        sellerName: listing.sellerId.name,
        buyerName,
        wasteType: listing.wasteType,
        weight: listing.weight,
        co2Saved: CO2_SAVED,
        date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }),
        hash,
        listingId: listing._id.toString().toUpperCase()
      });

      doc.end();
    });

    // Email PDF to Seller
    await sendNotification(
      listing.sellerId._id,
      'certificate',
      `Congratulations! Your premium Green Certificate for "${listing.wasteType}" is ready. You have successfully diverted ${listing.weight}kg of industrial waste.`,
      listing._id,
      {
        filename: `WasteWise_Certificate_${listing._id}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }
    );

    res.status(200).json({
      message: 'Receipt confirmed and premium Green Certificate generated successfully.',
      listing
    });

  } catch (error) {
    console.error('Error in confirmReceipt:', error);
    res.status(500).json({ message: 'Server error confirming receipt' });
  }
};

// @desc    Download Green Certificate PDF
// @route   GET /api/listings/:id/certificate
// @access  Private
const getCertificate = async (req, res) => {
  try {
    const listingId = req.params.id;
    const listing = await Listing.findById(listingId).populate('sellerId', 'name');
    
    if (!listing || listing.status !== 'completed') {
      return res.status(404).json({ message: 'Certificate not found or listing not completed.' });
    }

    const agreement = await Agreement.findOne({ listingId: listing._id }).populate('buyerId', 'name');
    const buyerName = agreement?.buyerId?.name || 'Verified Buyer';

    const doc = new PDFDocument({ margin: 0, size: 'LETTER' });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=WasteWise_Certificate_${listingId}.pdf`);
    
    doc.pipe(res);

    drawCertificate(doc, {
      sellerName: listing.sellerId.name,
      buyerName,
      wasteType: listing.wasteType,
      weight: listing.weight,
      co2Saved: listing.carbonSaved,
      date: new Date(listing.updatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }),
      hash: listing.verificationId,
      listingId: listing._id.toString().toUpperCase()
    });

    doc.end();

  } catch (error) {
    console.error('Error in getCertificate:', error);
    res.status(500).json({ message: 'Server error generating certificate' });
  }
};

module.exports = {
  createListing,
  getAllActiveListings,
  getSellerListings,
  getBuyerBids,
  placeBid,
  completePayment,
  getFailedTransactions,
  confirmReceipt,
  getCertificate
};
