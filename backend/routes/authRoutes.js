const express = require('express');
const { registerUser, loginUser } = require('../controllers/authController');
const { protect, admin } = require('../middleware/authMiddleware');
const User = require('../models/User');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);

// Admin routes for approvals
router.get('/pending', protect, admin, async (req, res) => {
  try {
    const pendingUsers = await User.find({ isApproved: false, role: 'company-seller' }).select('-password');
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
    res.json({ message: 'User approved successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error approving user' });
  }
});

// Search users by email (for contract proposals)
router.get('/search', protect, async (req, res) => {
  try {
    const { email } = req.query;
    if (!email || email.length < 3) {
      return res.status(400).json({ message: 'Enter at least 3 characters to search' });
    }
    const users = await User.find({
      email: { $regex: email, $options: 'i' },
      _id: { $ne: req.user.id } // Exclude self
    }).select('_id name email role').limit(10);
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error searching users' });
  }
});

module.exports = router;
