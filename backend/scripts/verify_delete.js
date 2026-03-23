const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const { deleteNotification } = require('../controllers/notificationController');

const MONGO_URI = 'mongodb://localhost:27017/wisewaste';

async function verify() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Create a dummy notification
    const userId = new mongoose.Types.ObjectId();
    const notification = await Notification.create({
      userId,
      type: 'admin_alert',
      message: 'Test notification'
    });
    console.log('Created test notification:', notification._id);

    // Mock request and response
    const req = {
      params: { id: notification._id.toString() },
      user: { id: userId.toString() }
    };
    const res = {
      json: (data) => console.log('Response JSON:', data),
      status: (code) => ({ json: (data) => console.log(`Response Status ${code}:`, data) })
    };

    // Call deleteNotification
    console.log('Calling deleteNotification...');
    await deleteNotification(req, res);

    // Verify it's gone
    const found = await Notification.findById(notification._id);
    if (!found) {
      console.log('SUCCESS: Notification was deleted');
    } else {
      console.log('FAILURE: Notification still exists');
    }

    // Test deleting someone else's notification
    const otherUserId = new mongoose.Types.ObjectId();
    const otherNotification = await Notification.create({
      userId: otherUserId,
      type: 'admin_alert',
      message: 'Other user notification'
    });
    console.log('Created other user notification:', otherNotification._id);

    const reqWrongUser = {
      params: { id: otherNotification._id.toString() },
      user: { id: userId.toString() } // Different from notification owner
    };

    console.log('Calling deleteNotification with wrong user...');
    await deleteNotification(reqWrongUser, res);

    const foundOther = await Notification.findById(otherNotification._id);
    if (foundOther) {
      console.log('SUCCESS: Other user notification was NOT deleted');
      await Notification.findByIdAndDelete(otherNotification._id);
    } else {
      console.log('FAILURE: Other user notification was deleted!');
    }

  } catch (err) {
    console.error('Error during verification:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

verify();
