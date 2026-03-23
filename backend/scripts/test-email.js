require('dotenv').config();
const { sendNotification } = require('../controllers/notificationController');
const mongoose = require('mongoose');
const User = require('../models/User');

async function testEmail() {
    try {
        console.log('--- WasteWise Email Test Script ---');
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/wisewaste');
        
        // Find any user
        const user = await User.findOne();
        if (!user) {
            console.error('No users found in database. Please create a user first.');
            process.exit(1);
        }

        console.log(`Found User: ${user.name} (${user.email})`);
        
        const testTypes = ['auction_won', 'outbid', 'certificate', 'admin_alert'];
        
        for (const type of testTypes) {
            console.log(`Sending test email for type: ${type}...`);
            await sendNotification(
                user._id,
                type,
                `This is a test notification of type ${type.toUpperCase()} from the WasteWise system. Your integration is working perfectly!`,
                null
            );
        }

        console.log('Tests completed. Check the console for [EMAIL SUCCESS] logs and your inbox.');
        mongoose.connection.close();
    } catch (err) {
        console.error('Test failed:', err);
    }
}

testEmail();
