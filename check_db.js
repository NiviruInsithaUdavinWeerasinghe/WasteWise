const mongoose = require('mongoose');

// Manually define the schema since eval is tricky with relative paths
const ListingSchema = new mongoose.Schema({
  wasteType: String,
  status: String,
  bids: [{
    userId: mongoose.Schema.Types.ObjectId,
    amount: Number,
    timestamp: Date
  }],
  defaultedBids: [{
    userId: mongoose.Schema.Types.ObjectId,
    amount: Number,
    date: Date
  }]
}, { strict: false });

const Listing = mongoose.model('Listing', ListingSchema);

async function check() {
  await mongoose.connect('mongodb://localhost:27017/wastewise');
  const l = await Listing.findOne({ wasteType: /Blended/ });
  console.log(JSON.stringify(l, null, 2));
  process.exit();
}

check();
