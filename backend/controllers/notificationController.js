const nodemailer = require('nodemailer');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { getTemplate } = require('../utils/emailTemplates');
const path = require('path');

// Path to the system logo
const LOGO_PATH = path.join(__dirname, '../../app/src/assets/logo(v2.2).png');

/**
 * Configure Nodemailer transporter
 * Using Gmail as requested by the user.
 */
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/**
 * Reusable function to dispatch both email and in-app Notification
 */
const sendNotification = async (userId, type, message, relatedEntityId = null) => {
  try {
    // 1. Create DB Notification
    await Notification.create({
      userId,
      type,
      message,
      relatedEntityId
    });

    // 2. Fetch User to get Email Address
    const user = await User.findById(userId);
    if (!user) {
      console.log(`Notification saved for ${userId}, but user not found for email.`);
      return;
    }

    // 3. Send Email (Non-Blocking / Fire-and-Forget)
    // Only attempt if credentials are provided
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      const emailHtml = getTemplate(user.name || 'User', message, type);
      
      const mailOptions = {
        from: `"WasteWise Alerts" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: `WasteWise Alert: ${type.toUpperCase().replace('_', ' ')}`,
        html: emailHtml,
        attachments: [
          {
            filename: 'logo.png',
            path: LOGO_PATH,
            cid: 'logo'
          }
        ]
      };

      // We do NOT await this. It runs in the background.
      transporter.sendMail(mailOptions)
        .then(() => console.log(`[EMAIL DISPATCHED] ${user.email} (Type: ${type})`))
        .catch(err => console.error(`[EMAIL ERROR] Failed for ${user.email}:`, err));
      
      // Return early while the mail is being sent in the background
      return true;
    } else {
      console.log(`[MOCK EMAIL] To: ${user.email} | Message: ${message.substring(0, 30)}...`);
      return true;
    }

  } catch (error) {
    console.error('Error sending notification:', error);
  }
};

// Handlers for Frontend Polling
const getUserNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification || notification.userId.toString() !== req.user.id) {
       return res.status(404).json({ message: 'Notification not found' });
    }
    notification.isRead = true;
    await notification.save();
    res.json(notification);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const markAllAsRead = async (req, res) => {
  try {
    console.log(`[READ-ALL] Request for user: ${req.user.id}`);
    const result = await Notification.updateMany(
      { userId: req.user.id, isRead: false },
      { $set: { isRead: true } }
    );
    console.log(`[READ-ALL] Modified ${result.modifiedCount} documents`);
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    console.error('[READ-ALL] Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  sendNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead
};
