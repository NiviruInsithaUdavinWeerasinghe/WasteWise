require('dotenv').config();
const mongoose = require('mongoose');
const Notification = require('./models/Notification');
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/wisewaste';

async function verify() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Since we don't know the exact user, let's find one with many notifications
    const usersWithNotifications = await Notification.aggregate([
      { $group: { _id: '$userId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 }
    ]);

    if (usersWithNotifications.length === 0) {
      console.log('No notifications found in database.');
      process.exit(0);
    }

    const testUser = usersWithNotifications[0]._id;
    const totalCount = usersWithNotifications[0].count;
    console.log(`Testing with User ID: ${testUser} (${totalCount} notifications total)`);

    // Test Page 1, Limit 10
    const page1 = await Notification.find({ userId: testUser })
      .sort({ createdAt: -1 })
      .skip(0)
      .limit(10);
    console.log(`Page 1 (limit 10) count: ${page1.length}`);

    // Test Page 2, Limit 10
    const page2 = await Notification.find({ userId: testUser })
      .sort({ createdAt: -1 })
      .skip(10)
      .limit(10);
    console.log(`Page 2 (limit 10) count: ${page2.length}`);

    if (page1.length > 0 && page2.length > 0) {
      const isDifferent = page1[0]._id.toString() !== page2[0]._id.toString();
      console.log(`Page 1 vs Page 2: ${isDifferent ? 'SUCCESS (Different data)' : 'FAIL (Same data)'}`);
    } else {
        console.log('Not enough data to test page 2 vs page 1 difference.');
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

verify();
