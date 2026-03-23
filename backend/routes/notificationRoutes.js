const express = require('express');
const router = express.Router();
const { getUserNotifications, markAsRead, markAllAsRead, deleteNotification } = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware'); // Reusing existing middleware

// Get all notifications for logged-in user
router.get('/', protect, getUserNotifications);

// Mark a specific notification as read
router.patch('/:id/read', protect, markAsRead);

// Mark all as read
router.patch('/read-all', protect, markAllAsRead);

// Delete a notification
router.delete('/:id', protect, deleteNotification);

module.exports = router;
