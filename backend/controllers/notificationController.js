const nodemailer = require('nodemailer');
const Notification = require('../models/Notification');
const User = require('../models/User');

// Configure Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail', // or any other service like smtp.mailtrap.io
  auth: {
    user: process.env.EMAIL_USER || 'no-reply@wastewise.com',
    pass: process.env.EMAIL_PASS || 'dummy-password'
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
    if (!user || (!process.env.EMAIL_USER && process.env.NODE_ENV !== 'development')) {
      console.log(`Notification saved for ${userId}, but email skipped (No valid user/SMTP config).`);
      return;
    }

    // 3. Send Email
    const mailOptions = {
      from: '"WasteWise Notifications" <no-reply@wastewise.com>',
      to: user.email,
      subject: `WasteWise Alert: ${type.toUpperCase()}`,
      html: `<div style="font-family: Arial, sans-serif; p-4;">
               <h2 style="color: #22c55e;">WasteWise Notification</h2>
               <p style="font-size: 16px;">Hello ${user.name},</p>
               <p style="font-size: 16px;">${message}</p>
               <br/>
               <p style="font-size: 12px; color: #666;">This is an automated message from the Factory Waste Management System.</p>
             </div>`
    };

    // If EMAIL_USER is configured, attempt sending. Otherwise, mock it.
    if (process.env.EMAIL_USER) {
      await transporter.sendMail(mailOptions);
      console.log(`Email dispatched successfully to ${user.email}`);
    } else {
      console.log(`[MOCK EMAIL] To: ${user.email} | Subject: ${mailOptions.subject}`);
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

module.exports = {
  sendNotification,
  getUserNotifications,
  markAsRead
};
