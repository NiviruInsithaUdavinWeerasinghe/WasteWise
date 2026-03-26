const mongoose = require('mongoose');

async function fix() {
  await mongoose.connect('mongodb://localhost:27017/wisewaste');
  const db = mongoose.connection.db;
  const users = db.collection('users');
  const tf = await users.findOne({ name: 'TradeFord' });
  
  if (!tf) {
    console.error('TradeFord user not found');
    process.exit(1);
  }

  // 1. Clear previous defaultedBids I added
  await db.collection('listings').updateOne(
    { _id: new mongoose.Types.ObjectId('69c392310e228672330a0439') },
    { $set: { defaultedBids: [] } }
  );

  // 2. Add the CORRECT winning bid (60,000) for TradeFord
  const res = await db.collection('listings').updateOne(
    { _id: new mongoose.Types.ObjectId('69c392310e228672330a0439') },
    { 
      $push: { 
        defaultedBids: { 
          userId: tf._id, 
          amount: 60000, 
          date: new Date('2026-03-25T13:45:00.000Z') // Slightly later timestamp
        } 
      }
    }
  );

  console.log('Update result:', res);
  process.exit();
}

fix();
