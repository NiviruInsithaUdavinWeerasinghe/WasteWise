const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const Listing = require('../models/Listing');
const Agreement = require('../models/Agreement');

async function verify() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const userCount = await User.countDocuments();
    const listingCount = await Listing.countDocuments();
    const agreementCount = await Agreement.countDocuments();
    const completedCount = await Listing.countDocuments({ status: 'completed' });

    console.log(`Users: ${userCount}`);
    console.log(`Listings: ${listingCount}`);
    console.log(`Agreements: ${agreementCount}`);
    console.log(`Completed Listings: ${completedCount}`);

    if (userCount === 0 && listingCount === 0) {
      console.log('WARNING: No data found in database. Activity feed will be empty!');
    }

    process.exit(0);
  } catch (error) {
    console.error('Verification failed:', error);
    process.exit(1);
  }
}

verify();
