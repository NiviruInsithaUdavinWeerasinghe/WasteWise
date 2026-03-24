require('dotenv').config();
const mongoose = require('mongoose');
const Listing = require('../models/Listing');
const User = require('../models/User');
const Agreement = require('../models/Agreement');
const { confirmReceipt, getCertificate } = require('../controllers/listingController');

async function verify() {
  try {
    console.log('--- Green Certificate Verification ---');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/wisewaste');
    console.log('Connected to MongoDB.');

    // 1. Find or Create a 'sold' listing
    let listing = await Listing.findOne({ status: 'sold' });
    if (!listing) {
      console.log('No "sold" listing found. Creating a test one...');
      const seller = await User.findOne({ role: 'company-seller' });
      const buyer = await User.findOne({ role: 'company-buyer' });
      
      if (!seller || !buyer) {
        console.error('Need at least one seller and one buyer in DB.');
        process.exit(1);
      }

      listing = await Listing.create({
        sellerId: seller._id,
        wasteType: 'Test Fabric',
        weight: 100,
        condition: 'Used',
        location: 'Colombo',
        sellingMethod: 'direct',
        price: 5000,
        status: 'sold'
      });

      await Agreement.create({
        buyerId: buyer._id,
        sellerId: seller._id,
        listingId: listing._id,
        finalPrice: 5000,
        commissionDeduced: 150,
        pickupResponsibility: 'Buyer Arranges Pickup'
      });
    }

    console.log(`Using Listing ID: ${listing._id} (Status: ${listing.status})`);

    // 2. Mock Request/Response for confirmReceipt
    const req = {
      params: { id: listing._id.toString() },
      user: { id: 'mock-buyer-id' } // Note: Controller doesn't strictly check user consistency yet, but middleware does
    };
    
    const res = {
      status: function(s) { this.statusCode = s; return this; },
      json: function(j) { this.data = j; return this; }
    };

    console.log('Calling confirmReceipt...');
    await confirmReceipt(req, res);

    if (res.statusCode === 200) {
      console.log('SUCCESS: Receipt confirmed.');
      console.log('Carbon Saved:', res.data.listing.carbonSaved);
      console.log('Verification ID:', res.data.listing.verificationId);
      
      // Verify in DB
      const updatedListing = await Listing.findById(listing._id);
      console.log('DB Status:', updatedListing.status);
    } else {
      console.error('FAILED: confirmReceipt returned', res.statusCode, res.data);
      process.exit(1);
    }

    // 3. Mock Request/Response for getCertificate
    const resCert = {
      statusCode: 200,
      status: function(s) { this.statusCode = s; return this; },
      json: function(j) { this.data = j; return this; },
      setHeader: function(k, v) { console.log(`Header: ${k} = ${v}`); },
      pipe: function(dest) { console.log('Piping PDF stream...'); return this; },
      end: function() { console.log('PDF stream ended.'); },
      on: function(e, cb) { if (e === 'finish') cb(); return this; },
      once: function(e, cb) { return this; },
      emit: function(e) { return this; },
      write: function(d) { return true; }
    };

    console.log('Calling getCertificate...');
    await getCertificate(req, resCert);

    console.log('Verification complete.');
    mongoose.connection.close();
  } catch (err) {
    console.error('Verification failed:', err);
    process.exit(1);
  }
}

verify();
