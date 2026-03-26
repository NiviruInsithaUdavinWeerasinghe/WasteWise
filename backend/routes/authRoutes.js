const express = require('express');
const jwt = require('jsonwebtoken');
const { registerUser, loginUser, generateToken, changePassword } = require('../controllers/authController');
const { protect, admin } = require('../middleware/authMiddleware');
const User = require('../models/User');
const Listing = require('../models/Listing');
const Agreement = require('../models/Agreement');
const AuditLog = require('../models/AuditLog');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/change-password', protect, changePassword);

// Admin routes for approvals
router.get('/pending', protect, admin, async (req, res) => {
  try {
    const pendingUsers = await User.find({ isApproved: false }).select('-password');
    res.json(pendingUsers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching pending users' });
  }
});

router.put('/approve/:id', protect, admin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    user.isApproved = true;
    await user.save();

    // Log the approval
    await AuditLog.create({
      userId: user._id,
      action: 'Account Approved',
      details: `The admin has approved the ${user.role} account for ${user.name}.`,
      type: 'account_update'
    });

    res.json({ message: 'User approved successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error approving user' });
  }
});

router.get('/admin-stats', protect, admin, async (req, res) => {
  try {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const stats = [];
    
    // Totals for top cards
    const totalVerifiedFactories = await User.countDocuments({ role: 'company-seller', isApproved: true });
    const totalUsers = await User.countDocuments({ role: { $ne: 'admin' } });
    const totalCertificates = await Listing.countDocuments({ status: 'completed' });

    for (let i = 6; i >= 0; i--) {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      startOfDay.setDate(startOfDay.getDate() - i);

      const endOfDay = new Date(startOfDay);
      endOfDay.setHours(23, 59, 59, 999);

      const userCount = await User.countDocuments({
        createdAt: { $gte: startOfDay, $lte: endOfDay }
      });

      const transCount = await Listing.countDocuments({
        status: { $in: ['sold', 'paid', 'completed'] },
        updatedAt: { $gte: startOfDay, $lte: endOfDay }
      });

      stats.push({
        label: i === 0 ? 'Today' : days[startOfDay.getDay()],
        newUsers: userCount,
        transactions: transCount
      });
    }

    res.json({
      chartData: stats,
      summary: {
        totalVerifiedFactories,
        totalUsers,
        totalCertificates
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching admin stats' });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
  try {
    console.log(`Profile update request for user: ${req.user.id}`);
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { name, profilePhoto, companyDetails, phoneNumber } = req.body;

    if (name) user.name = name;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (profilePhoto !== undefined) user.profilePhoto = profilePhoto;
    if (companyDetails) {
      user.companyDetails = {
        ...user.companyDetails,
        ...companyDetails
      };
      user.markModified('companyDetails');
    }

    await user.save();

    // Log the update
    await AuditLog.create({
      userId: user._id,
      action: 'Account Updated',
      details: `${user.name} updated their account profile details.`,
      type: 'account_update'
    });

    res.json({
      _id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isApproved: user.isApproved,
      profilePhoto: user.profilePhoto,
      phoneNumber: user.phoneNumber,
      companyDetails: user.companyDetails,
      token: generateToken(user._id)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error updating profile' });
  }
});

// @route   GET /api/auth/activity
// @desc    Get recent platform activity for admin
// @access  Private/Admin
router.get('/activity', protect, admin, async (req, res) => {
  try {
    const { date } = req.query;
    let queryFilter = {};
    let auditFilter = { type: 'account_update' };

    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);

      queryFilter.createdAt = { $gte: start, $lte: end };
      auditFilter.createdAt = { $gte: start, $lte: end };
    }

    // 1. Recent Users
    const recentUsers = await User.find({ role: { $ne: 'admin' }, ...queryFilter })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('name email role createdAt');

    // 2. Recent Listings
    const recentListings = await Listing.find(queryFilter)
      .populate('sellerId', 'name')
      .sort({ createdAt: -1 })
      .limit(10);

    // 3. Recent Bids (extracted from recent listings with bids)
    const bidFilter = date ? { 'bids.timestamp': { $gte: new Date(date).setHours(0, 0, 0, 0), $lte: new Date(date).setHours(23, 59, 59, 999) } } : { 'bids.0': { $exists: true } };
    const listingsWithBids = await Listing.find(bidFilter)
      .populate('bids.userId', 'name')
      .sort({ 'bids.timestamp': -1 })
      .limit(20);

    let allBids = [];
    listingsWithBids.forEach(l => {
      l.bids.forEach(b => {
        const bDate = new Date(b.timestamp);
        if (date) {
          const d = new Date(date);
          if (bDate.toDateString() !== d.toDateString()) return;
        }

        allBids.push({
          _id: b._id,
          type: 'Bid',
          item: `${l.wasteType} bid`,
          amount: `LKR ${b.amount}`,
          partner: b.userId?.name || 'Unknown User',
          date: b.timestamp,
          status: 'Active',
          listingId: l._id,
          imageUrl: l.imageUrl,
          wasteType: l.wasteType
        });
      });
    });
    allBids = allBids.sort((a, b) => b.date - a.date).slice(0, 15);

    // 4. Recent SLAs (Agreements)
    const recentAgreements = await Agreement.find(queryFilter)
      .populate('sellerId', 'name')
      .populate('buyerId', 'name')
      .populate('listingId', 'wasteType imageUrl')
      .sort({ createdAt: -1 })
      .limit(10);

    // 5. Recent Completed (Green Certificates)
    const completedFilter = { status: 'completed' };
    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      completedFilter.updatedAt = { $gte: start, $lte: end };
    }
    const recentCompleted = await Listing.find(completedFilter)
      .populate('sellerId', 'name')
      .sort({ updatedAt: -1 })
      .limit(10);

    // 6. Recent Audit Logs (Account Updates & Transactions)
    const recentAuditLogs = await AuditLog.find({ ...auditFilter, type: { $in: ['account_update', 'transaction'] } })
      .populate('userId', 'name profilePhoto')
      .sort({ createdAt: -1 })
      .limit(10);

    // Unify all into a single feed
    const activityFeed = [
      ...recentUsers.map(u => ({
        id: u._id,
        type: 'User',
        item: `New ${u.role === 'company-seller' ? 'Seller' : 'Buyer'} Registered`,
        partner: u.name,
        amount: '-',
        date: u.createdAt,
        status: 'Approved',
        description: u.companyDetails?.address ? `Registered at ${u.companyDetails.address}` : `A new ${u.role} has joined WasteWise.`,
        email: u.email,
        location: u.companyDetails?.address || 'Sri Lanka',
        role: u.role
      })),
      ...recentListings.map(l => ({
        id: l._id,
        type: l.sellingMethod === 'auction' ? 'Auction' : 'Sale',
        item: `New Listing: ${l.wasteType} (${l.weight}kg)`,
        partner: l.sellerId?.name || 'Unknown Seller',
        amount: l.sellingMethod === 'auction' ? `Starting LKR ${l.startingBid}` : `LKR ${l.price}`,
        date: l.createdAt,
        status: l.status.charAt(0).toUpperCase() + l.status.slice(1),
        description: l.description,
        imageUrl: l.imageUrl,
        location: l.location,
        condition: l.condition,
        wasteType: l.wasteType,
        weight: l.weight
      })),
      ...allBids.map(b => ({
        id: b._id,
        type: 'Bid',
        item: b.item,
        amount: b.amount,
        partner: b.partner,
        date: b.date,
        status: b.status,
        listingId: b.listingId?._id || b.listingId,
        description: `Bid of ${b.amount} placed on ${b.wasteType || 'Material'}.`,
        imageUrl: b.imageUrl,
        wasteType: b.wasteType
      })),
      ...recentAgreements.map(a => ({
        id: a._id,
        type: 'Contract',
        item: `SLA Signed: ${a.listingId?.wasteType || 'Material'}`,
        partner: a.buyerId?.name || 'Buyer',
        amount: `LKR ${a.finalPrice}`,
        date: a.createdAt,
        status: 'Completed',
        listingId: a.listingId?._id || a.listingId,
        description: `Service Level Agreement established between ${a.sellerId?.name} and ${a.buyerId?.name}.`,
        location: 'Platform Digital Sign',
        imageUrl: a.listingId?.imageUrl,
        wasteType: a.listingId?.wasteType
      })),
      ...recentCompleted.map(c => ({
        id: c._id,
        type: 'Certificate',
        item: `Green Certificate Issued: ${c.wasteType}`,
        partner: c.sellerId?.name || 'Seller',
        amount: `${(c.carbonSaved || c.weight * 15.6).toFixed(1)}kg CO2`,
        date: c.updatedAt,
        status: 'Verified',
        listingId: c._id,
        description: `Environmental impact verified for ${c.wasteType} diversion. Carbon footprint reduced significantly.`,
        imageUrl: c.imageUrl,
        location: c.location,
        wasteType: c.wasteType,
        weight: c.weight,
        carbonSaved: c.carbonSaved || c.weight * 15.6
      })),
      ...recentAuditLogs.map(log => ({
        id: log._id,
        type: 'System',
        item: log.action,
        partner: log.userId?.name || 'User',
        amount: '-',
        date: log.createdAt,
        status: 'Approved',
        description: log.details,
        imageUrl: log.userId?.profilePhoto,
      }))
    ];

    // Sort by date descending
    activityFeed.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json(activityFeed.slice(0, 30));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching activity feed' });
  }
});

// Search users by email (for contract proposals)
router.get('/search', protect, async (req, res) => {
  try {
    const { email } = req.query;
    if (!email || email.length < 2) {
      return res.status(400).json({ message: 'Enter at least 2 characters to search' });
    }

    const requesterRole = req.user.role;
    let allowedTargetRoles = [];

    if (requesterRole === 'company-seller') {
      // Sellers can propose to Buyers
      allowedTargetRoles = ['company-buyer', 'individual'];
    } else if (requesterRole === 'company-buyer' || requesterRole === 'individual') {
      // Buyers can propose to Company Sellers
      allowedTargetRoles = ['company-seller'];
    }

    // Guard: Only allow search if requester has a valid trading role
    if (allowedTargetRoles.length === 0) {
      return res.json([]);
    }

    const users = await User.find({
      email: { $regex: email, $options: 'i' },
      _id: { $ne: req.user.id }, // Exclude self
      role: { $in: allowedTargetRoles },
      isApproved: true // Only approved counterparties
    }).select('_id name email role').limit(10);
    
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error searching users' });
  }
});

module.exports = router;
