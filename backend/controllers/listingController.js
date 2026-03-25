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

    // Automatically generate a "Listing Created" alert instead of Green Certificate
    await sendNotification(
      sellerId,
      'info',
      `Your listing for ${weight}kg of "${wasteType}" has been successfully published.`,
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
      .populate('sellerId', 'name email role profilePhoto')
      .populate('bids.userId', 'name email profilePhoto');
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
      .populate('sellerId', 'name email role profilePhoto')
      .populate('bids.userId', 'name email profilePhoto')
      .sort({ createdAt: -1 });

    res.status(200).json(listings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching seller listings' });
  }
};

// @desc    Get a single listing by ID
// @route   GET /api/listings/:id
// @access  Public
const getListingById = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id)
      .populate('sellerId', 'name email role profilePhoto')
      .populate('bids.userId', 'name profilePhoto');

    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    res.status(200).json(listing);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching listing' });
  }
};

// @desc    Get listings where the buyer has placed bids
// @route   GET /api/listings/buyer/bids
// @access  Private
const getBuyerBids = async (req, res) => {
  try {
    const userId = req.user.id;
    const listings = await Listing.find({ 'bids.userId': userId })
      .populate('sellerId', 'name email role profilePhoto')
      .populate('bids.userId', 'name email profilePhoto')
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
      .populate('sellerId', 'name email role profilePhoto')
      .populate('bids.userId', 'name email role profilePhoto');
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
 * Luxury design with decorative borders, corner ornaments, gold/green palette
 */
const drawCertificate = (doc, data) => {
  const { sellerName, buyerName, wasteType, weight, co2Saved, date, hash, listingId } = data;

  const PAGE_W = 612;
  const PAGE_H = 792;

  // ─── Color palette (matching logo: medium green + teal) ────────
  const DARK_GREEN = '#0f6648';  // deep teal-green (logo shadow tone)
  const MID_GREEN = '#1a9460';  // medium green (logo mid tone)
  const BRIGHT_GREEN = '#4ade80';  // bright green (logo highlight)
  const TEAL = '#14b8a6';  // teal accent (logo right side)
  const GOLD = '#c9a84c';
  const GOLD_LIGHT = '#e8d08a';
  const CREAM = '#fffef7';
  const IVORY = '#f0fdf8';  // very light teal-tinted ivory

  // ─── Full page background (cream parchment) ───────────────────
  doc.rect(0, 0, PAGE_W, PAGE_H).fill(CREAM);

  // ─── Decorative background triangle top-left ──────────────────
  doc.save();
  doc.moveTo(0, 0).lineTo(220, 0).lineTo(0, 220).closePath().fill('#0f6648');
  doc.restore();



  // ─── Outer gold border ────────────────────────────────────────
  doc.rect(22, 22, PAGE_W - 44, PAGE_H - 44).lineWidth(3).stroke(GOLD);

  // ─── Inner green border ───────────────────────────────────────
  doc.rect(29, 29, PAGE_W - 58, PAGE_H - 58).lineWidth(1).stroke(TEAL);

  // ─── Second inner gold border ─────────────────────────────────
  doc.rect(34, 34, PAGE_W - 68, PAGE_H - 68).lineWidth(0.6).stroke(GOLD_LIGHT);

  // ─── Corner ornament helper ───────────────────────────────────
  const drawCorner = (cx, cy, rotation) => {
    doc.save();
    doc.translate(cx, cy).rotate(rotation);
    // L-shaped gold corner bracket
    doc.moveTo(-26, -2).lineTo(-2, -2).lineTo(-2, -26)
      .lineWidth(3).stroke(GOLD);
    doc.moveTo(-32, -2).lineTo(-2, -2).lineTo(-2, -32)
      .lineWidth(0.8).stroke(GOLD_LIGHT);
    // Small diamond ornament at corner
    doc.save();
    doc.translate(-2, -2);
    doc.moveTo(0, -6).lineTo(5, 0).lineTo(0, 6).lineTo(-5, 0).closePath().fill(GOLD);
    doc.restore();
    doc.restore();
  };

  // Four corners (top-left, top-right, bottom-right, bottom-left)
  drawCorner(22, 22, 0);
  drawCorner(PAGE_W - 22, 22, 90);
  drawCorner(PAGE_W - 22, PAGE_H - 22, 180);
  drawCorner(22, PAGE_H - 22, 270);

  // ─── Top green header band ────────────────────────────────────
  doc.rect(34, 34, PAGE_W - 68, 95).fill(DARK_GREEN);

  // ─── Header: logo + brand name ────────────────────────────────
  try {
    doc.image(LOGO_PATH, 52, 46, { width: 68 });
  } catch (err) {
    console.warn('Logo not found, skipping image.');
  }

  doc.fillColor('#ffffff').fontSize(17).font('Helvetica-Bold')
    .text('WasteWise Platform', 135, 55, { lineBreak: false });
  doc.fillColor(GOLD_LIGHT).fontSize(8.5).font('Helvetica')
    .text('OFFICIAL SUSTAINABILITY VERIFICATION SERVICE', 135, 77, { lineBreak: false, characterSpacing: 0.8 });

  // Gold divider in header
  doc.rect(135, 92, 420, 0.8).fill(GOLD);

  doc.fillColor('#d1fae5').fontSize(8).font('Helvetica')
    .text(`CERTIFICATE NO: ${listingId.slice(0, 16)}`, 135, 100, { lineBreak: false });

  // ─── Circular seal / badge (top-right of header) ─────────────
  const SEAL_CX = PAGE_W - 78;
  const SEAL_CY = 82;
  const SEAL_R = 36;

  // Outer golden ring
  doc.circle(SEAL_CX, SEAL_CY, SEAL_R + 5).fill(GOLD);
  doc.circle(SEAL_CX, SEAL_CY, SEAL_R + 2).fill(DARK_GREEN);
  doc.circle(SEAL_CX, SEAL_CY, SEAL_R).fill(MID_GREEN);
  // Teal inner fill accent
  doc.circle(SEAL_CX, SEAL_CY, SEAL_R - 10).fill(TEAL);
  // Inner ring
  doc.circle(SEAL_CX, SEAL_CY, SEAL_R - 8).lineWidth(1).stroke(GOLD_LIGHT);

  // Leaf/star burst lines on seal
  for (let a = 0; a < 360; a += 30) {
    const rad = (a * Math.PI) / 180;
    const x1 = SEAL_CX + (SEAL_R - 14) * Math.cos(rad);
    const y1 = SEAL_CY + (SEAL_R - 14) * Math.sin(rad);
    const x2 = SEAL_CX + (SEAL_R - 4) * Math.cos(rad);
    const y2 = SEAL_CY + (SEAL_R - 4) * Math.sin(rad);
    doc.moveTo(x1, y1).lineTo(x2, y2).lineWidth(1).stroke(GOLD_LIGHT);
  }

  doc.fillColor('#ffffff').fontSize(10).font('Helvetica-Bold')
    .text('VERIFIED', SEAL_CX - 24, SEAL_CY - 5, { width: 48, align: 'center', lineBreak: false });

  // ─── Decorative wave divider below header ─────────────────────
  doc.save();
  const WY = 129;
  doc.moveTo(34, WY);
  for (let x = 34; x <= PAGE_W - 34; x += 20) {
    doc.bezierCurveTo(x + 5, WY - 4, x + 15, WY + 4, x + 20, WY);
  }
  doc.lineWidth(1.5).stroke(GOLD);
  doc.restore();

  // ─── "Certificate of" label ───────────────────────────────────
  doc.fillColor(TEAL).fontSize(11).font('Helvetica')
    .text('C E R T I F I C A T E   O F', 34, 142, { width: PAGE_W - 68, align: 'center', lineBreak: false, characterSpacing: 3 });

  // ─── Main title ───────────────────────────────────────────────
  doc.fillColor(MID_GREEN).fontSize(30).font('Helvetica-Bold')
    .text('GREEN ACHIEVEMENT', 34, 158, { width: PAGE_W - 68, align: 'center', lineBreak: false });

  // Gold underline for title
  doc.rect(170, 196, 272, 2).fill(GOLD);
  doc.rect(195, 200, 222, 0.8).fill(GOLD_LIGHT);

  // ─── Subtitle ─────────────────────────────────────────────────
  doc.fillColor('#4b5563').fontSize(9.5).font('Helvetica')
    .text('Issued for Industrial Waste Diversion Compliance', 34, 210, { width: PAGE_W - 68, align: 'center', lineBreak: false, characterSpacing: 0.5 });

  // ─── "This certifies that" text ───────────────────────────────
  doc.fillColor('#374151').fontSize(10.5).font('Helvetica')
    .text('This document serves as formal verification that the following member organization:', 70, 238, { width: PAGE_W - 140, align: 'center' });

  // ─── Company name with gold underline ─────────────────────────
  doc.fillColor(MID_GREEN).fontSize(22).font('Helvetica-Bold')
    .text(sellerName.toUpperCase(), 60, 272, { width: PAGE_W - 120, align: 'center', lineBreak: false, characterSpacing: 1.5 });

  // Decorative underline beneath company name
  const nameW = Math.min(sellerName.length * 13 + 40, 380);
  const nameX = (PAGE_W - nameW) / 2;
  doc.rect(nameX, 298, nameW, 1.5).fill(GOLD);
  doc.rect(nameX + 10, 301, nameW - 20, 0.5).fill(GOLD_LIGHT);

  doc.fillColor('#374151').fontSize(10.5).font('Helvetica')
    .text(
      'has successfully completed a sustainable waste management\ntransaction via the WasteWise circular supply chain network.',
      70, 313, { width: PAGE_W - 140, align: 'center', lineBreak: true }
    );

  // ─── Detail rows with alternating shading ─────────────────────
  const TABLE_X = 62;
  const TABLE_W = PAGE_W - 124;
  const LABEL_W = 160;
  const VAL_X = TABLE_X + LABEL_W + 12;
  const VAL_W = TABLE_W - LABEL_W - 12;
  const ROW_H = 30;
  let rowY = 366;

  const drawRow = (label, value, shade) => {
    if (shade) doc.rect(TABLE_X, rowY, TABLE_W, ROW_H).fill(IVORY);
    doc.fillColor(TEAL).fontSize(8.5).font('Helvetica-Bold')
      .text(label.toUpperCase() + ":", TABLE_X, rowY + 10, { width: TABLE_W * 0.45, align: 'right', lineBreak: false, characterSpacing: 0.5 });
    doc.fillColor('#111827').fontSize(10).font('Helvetica')
      .text(value, TABLE_X + TABLE_W * 0.45 + 15, rowY + 10, { width: TABLE_W * 0.5, align: 'left', lineBreak: false });
    rowY += ROW_H;
    // Row separator
    doc.rect(TABLE_X, rowY, TABLE_W, 0.5).fill('#e5e7eb');
  };

  // Table rows start here

  drawRow('Material Diverted', `${weight} KG of ${wasteType}`, false);
  drawRow('Verified Recipient', buyerName, true);
  drawRow('Certification Date', date, false);
  drawRow('Audit Reference ID', listingId, true);

  // ─── Environmental impact box (Lightened) ──────────────────────
  const BOX_Y = rowY + 16;
  // Main box with light ivory fill
  doc.rect(TABLE_X, BOX_Y, TABLE_W, 72).fill(IVORY);
  // Thin green border
  doc.rect(TABLE_X, BOX_Y, TABLE_W, 72).lineWidth(0.8).stroke(MID_GREEN);
  // Gold left accent (thick)
  doc.rect(TABLE_X, BOX_Y, 5, 72).fill(GOLD);

  doc.fillColor(MID_GREEN).fontSize(9).font('Helvetica-Bold')
    .text('ENVIRONMENTAL IMPACT SUMMARY', TABLE_X, BOX_Y + 15, { width: TABLE_W, align: 'center', lineBreak: false, characterSpacing: 0.8 });

  doc.fillColor(DARK_GREEN).fontSize(18).font('Helvetica-Bold')
    .text(`${co2Saved.toFixed(2)} KG CO2e AVOIDED`, TABLE_X, BOX_Y + 36, { width: TABLE_W, align: 'center', lineBreak: false });

  // ─── Fancy decorative divider ─────────────────────────────────
  const DIV_Y = BOX_Y + 90;
  doc.rect(62, DIV_Y, TABLE_W, 0.8).fill(GOLD_LIGHT);
  doc.circle(PAGE_W / 2, DIV_Y, 5).fill(GOLD);
  doc.circle(PAGE_W / 2 - 16, DIV_Y, 2.5).fill(GOLD_LIGHT);
  doc.circle(PAGE_W / 2 + 16, DIV_Y, 2.5).fill(GOLD_LIGHT);

  // ─── Signature area ───────────────────────────────────────────
  const SIG_Y = DIV_Y + 10;
  const SIG_PATH = require('path').join(__dirname, '../../app/src/assets/Niviru.png');

  // Left signature block - signature image
  try {
    doc.image(SIG_PATH, 105, SIG_Y, { width: 110, height: 40 });
  } catch (e) {
    console.warn('Signature image not found, skipping.');
  }
  doc.rect(80, SIG_Y + 44, 160, 0.8).fill('#374151');
  doc.fillColor('#374151').fontSize(9).font('Helvetica')
    .text('Authorized Signatory', 80, SIG_Y + 49, { width: 160, align: 'center', lineBreak: false });
  doc.fillColor(MID_GREEN).fontSize(8).font('Helvetica-Bold')
    .text('WasteWise Platform', 80, SIG_Y + 61, { width: 160, align: 'center', lineBreak: false });

  // Right signature block - date box (no image, styled box instead)
  doc.rect(PAGE_W - 240, SIG_Y, 160, 40).fill(IVORY);
  doc.rect(PAGE_W - 240, SIG_Y, 160, 40).lineWidth(0.5).stroke(GOLD_LIGHT);
  doc.fillColor(TEAL).fontSize(7.5).font('Helvetica-Bold')
    .text('DATE OF ISSUE', PAGE_W - 240, SIG_Y + 9, { width: 160, align: 'center', lineBreak: false, characterSpacing: 0.5 });
  doc.fillColor(MID_GREEN).fontSize(11).font('Helvetica-Bold')
    .text(date, PAGE_W - 240, SIG_Y + 23, { width: 160, align: 'center', lineBreak: false });
  doc.rect(PAGE_W - 240, SIG_Y + 44, 160, 0.8).fill('#374151');
  doc.fillColor('#374151').fontSize(9).font('Helvetica')
    .text('Official Certification', PAGE_W - 240, SIG_Y + 49, { width: 160, align: 'center', lineBreak: false });
  doc.fillColor(MID_GREEN).fontSize(8).font('Helvetica-Bold')
    .text('WasteWise Platform', PAGE_W - 240, SIG_Y + 61, { width: 160, align: 'center', lineBreak: false });

  // ─── Bottom footer area (Simplified) ──────────────────────────
  const FOOTER_Y = PAGE_H - 120; // Pushed down slightly

  // Blockchain hash row (centered)
  doc.fillColor(MID_GREEN).fontSize(7).font('Helvetica-Bold')
    .text('BLOCKCHAIN VERIFICATION HASH', 0, FOOTER_Y + 12, { width: PAGE_W, align: 'center', lineBreak: false, characterSpacing: 0.8 });
  doc.fillColor('#4b5563').fontSize(6.5).font('Courier')
    .text(hash, 0, FOOTER_Y + 24, { width: PAGE_W, align: 'center', lineBreak: false });

  doc.fillColor('#6b7280').fontSize(7).font('Helvetica')
    .text(
      'This certificate is a digital record of sustainability verified by the WasteWise circular economy protocol. ' +
      'It is legally binding between the participating parties as a record of environmental compliance.',
      52, FOOTER_Y + 42, { width: PAGE_W - 124, align: 'center' }
    );
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
    if (!listingId || listingId === 'undefined') {
      return res.status(400).json({ message: 'Valid Listing ID is required' });
    }
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

/**
 * Shared helper to draw a professional blue-themed Digital Trade Agreement (SLA)
 */
const drawAgreement = (doc, data) => {
  const {
    date,
    buyerName,
    buyerId,
    sellerName,
    sellerId,
    wasteType,
    weight,
    finalPrice,
    commission,
    pickupResponsibility,
    listingId
  } = data;

  const PAGE_W = 612;
  const PAGE_H = 792;
  const MARGIN = 50;

  // Colors - Professional Blue Theme
  const NAVY = '#1e3a8a';
  const BLUE_MAIN = '#3b82f6';
  const BLUE_LIGHT = '#eff6ff';
  const GRAY_DARK = '#374151';
  const GRAY_MED = '#6b7280';
  const GRAY_LIGHT = '#f3f4f6';

  // 1. Header with Blue Accent
  doc.rect(0, 0, PAGE_W, 120).fill(NAVY);

  doc.fillColor('#ffffff').fontSize(24).font('Helvetica-Bold')
    .text('DIGITAL TRADE AGREEMENT', MARGIN, 40);

  doc.fontSize(10).font('Helvetica')
    .text(`Document ID: SLA-${listingId.slice(-8).toUpperCase()}`, MARGIN, 75);
  doc.text(`Date of Issue: ${date}`, MARGIN, 90);

  // 2. Main Title Section
  let y = 150;
  doc.fillColor(NAVY).fontSize(16).font('Helvetica-Bold')
    .text('1. PARTIES TO THE AGREEMENT', MARGIN, y);

  y += 25;
  doc.rect(MARGIN, y, PAGE_W - (MARGIN * 2), 1).fill(BLUE_MAIN);

  y += 20;
  // Buyer & Seller Boxes
  const BOX_W = (PAGE_W - (MARGIN * 2) - 20) / 2;

  // Buyer
  doc.rect(MARGIN, y, BOX_W, 80).fill(BLUE_LIGHT);
  doc.fillColor(NAVY).fontSize(10).font('Helvetica-Bold').text('THE BUYER', MARGIN + 10, y + 10);
  doc.fillColor(GRAY_DARK).fontSize(11).font('Helvetica').text(buyerName, MARGIN + 10, y + 30);
  doc.fontSize(8).text(`User ID: ${buyerId}`, MARGIN + 10, y + 52);

  // Seller
  doc.rect(MARGIN + BOX_W + 20, y, BOX_W, 80).fill(BLUE_LIGHT);
  doc.fillColor(NAVY).fontSize(10).font('Helvetica-Bold').text('THE SELLER', MARGIN + BOX_W + 30, y + 10);
  doc.fillColor(GRAY_DARK).fontSize(11).font('Helvetica').text(sellerName, MARGIN + BOX_W + 30, y + 30);
  doc.fontSize(8).text(`User ID: ${sellerId}`, MARGIN + BOX_W + 30, y + 52);

  y += 110;

  // 3. Transaction Details
  doc.fillColor(NAVY).fontSize(16).font('Helvetica-Bold')
    .text('2. TRANSACTION DETAILS', MARGIN, y);

  y += 25;
  doc.rect(MARGIN, y, PAGE_W - (MARGIN * 2), 1).fill(BLUE_MAIN);

  y += 20;
  const drawDetailRow = (label, value, currentY) => {
    doc.fillColor(GRAY_MED).fontSize(10).font('Helvetica-Bold').text(label, MARGIN, currentY);
    doc.fillColor(GRAY_DARK).fontSize(10).font('Helvetica').text(value, MARGIN + 200, currentY, { align: 'right', width: PAGE_W - MARGIN * 2 - 200 });
    doc.rect(MARGIN, currentY + 15, PAGE_W - MARGIN * 2, 0.5).fill(GRAY_LIGHT);
    return currentY + 30;
  };

  y = drawDetailRow('Listed Material', `${wasteType} (${weight} KG)`, y);
  y = drawDetailRow('Transaction Reference', listingId, y);
  y = drawDetailRow('Final Agreed Price', `LKR ${finalPrice.toLocaleString()}`, y);
  y = drawDetailRow('Platform Service Fee', `LKR ${commission.toLocaleString()}`, y);
  y = drawDetailRow('Net Seller Payout', `LKR ${(finalPrice - commission).toLocaleString()}`, y);
  y = drawDetailRow('Pickup Responsibility', pickupResponsibility, y);

  y += 30;

  // 4. Terms & Conditions Summary
  doc.fillColor(NAVY).fontSize(16).font('Helvetica-Bold')
    .text('3. TERMS & CONDITIONS', MARGIN, y);

  y += 25;
  doc.rect(MARGIN, y, PAGE_W - (MARGIN * 2), 1).fill(BLUE_MAIN);

  y += 20;
  const terms = [
    'The Seller warrants that the material matches the description provided on the WasteWise platform.',
    'The Buyer agrees to fulfill the pickup/delivery responsibility as stated in Section 2.',
    'WasteWise acts as a facilitator and platform provider, charging a service commission fee.',
    'Any disputes regarding material quality must be reported within 48 hours of pickup/delivery.'
  ];

  terms.forEach(term => {
    doc.fillColor(GRAY_DARK).fontSize(9).font('Helvetica')
      .text(`• ${term}`, MARGIN + 10, y, { width: PAGE_W - (MARGIN * 2) - 20 });
    y += 22;
  });

  // 5. Footer
  const FOOTER_Y = PAGE_H - 80;
  doc.rect(0, FOOTER_Y, PAGE_W, 80).fill(GRAY_LIGHT);

  doc.fillColor(GRAY_MED).fontSize(8).font('Helvetica')
    .text('This is a digitally generated document and is legally binding through the WasteWise Platform User Agreement.', MARGIN, FOOTER_Y + 20, { align: 'center', width: PAGE_W - MARGIN * 2 });

  doc.fillColor(BLUE_MAIN).fontSize(10).font('Helvetica-Bold')
    .text('WasteWise Circular Economy Network', MARGIN, FOOTER_Y + 45, { align: 'center', width: PAGE_W - MARGIN * 2 });
};

// @desc    Download Digital Trade Agreement (SLA)
// @route   GET /api/agreements/:listingId/download
// @access  Private
const downloadAgreement = async (req, res) => {
  try {
    let { listingId } = req.params;

    // Handle cases where listingId might be 'undefined' or a malformed string if passed from a bad client state
    if (!listingId || listingId === 'undefined') {
      return res.status(400).json({ message: 'Valid Listing ID is required' });
    }

    // Find agreement and populate necessary fields
    const agreement = await Agreement.findOne({ listingId })
      .populate('buyerId', 'name email')
      .populate('sellerId', 'name email')
      .populate('listingId', 'wasteType weight');

    if (!agreement) {
      return res.status(404).json({ message: 'Agreement not found for this listing' });
    }

    // Security check: Only buyer or seller (or admin) can download
    const userId = req.user.id;
    const userRole = req.user.role;

    if (userRole !== 'admin' &&
      agreement.buyerId._id.toString() !== userId &&
      agreement.sellerId._id.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to view this agreement' });
    }

    const doc = new PDFDocument({ margin: 0, size: 'LETTER' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=TradeAgreement_${listingId}.pdf`);

    doc.pipe(res);

    drawAgreement(doc, {
      date: new Date(agreement.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }),
      buyerName: agreement.buyerId.name,
      buyerId: agreement.buyerId._id.toString(),
      sellerName: agreement.sellerId.name,
      sellerId: agreement.sellerId._id.toString(),
      wasteType: agreement.listingId.wasteType,
      weight: agreement.listingId.weight,
      finalPrice: agreement.finalPrice,
      commission: agreement.commissionDeduced,
      pickupResponsibility: agreement.pickupResponsibility,
      listingId: agreement.listingId._id.toString()
    });

    doc.end();

  } catch (error) {
    console.error('Error in downloadAgreement:', error);
    res.status(500).json({ message: 'Server error generating agreement' });
  }
};

module.exports = {
  createListing,
  getAllActiveListings,
  getListingById,
  getSellerListings,
  getBuyerBids,
  placeBid,
  completePayment,
  getFailedTransactions,
  confirmReceipt,
  getCertificate,
  downloadAgreement
};
