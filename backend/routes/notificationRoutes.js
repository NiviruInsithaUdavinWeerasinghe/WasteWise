const express = require('express');
const router = express.Router();
const { getUserNotifications, markAsRead } = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware'); // Reusing existing middleware

// Get all notifications for logged-in user
router.get('/', protect, getUserNotifications);

// Mark a specific notification as read
router.patch('/:id/read', protect, markAsRead);

module.exports = router;
