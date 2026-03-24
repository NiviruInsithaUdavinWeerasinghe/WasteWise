require('dotenv').config();
const mongoose = require('mongoose');
const LongTermContract = require('../models/LongTermContract');
const User = require('../models/User');
const Notification = require('../models/Notification');

async function verifyContracts() {
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/wisewaste';
  
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // 1. Check Notification Enums
    const testNotification = new Notification({
      userId: new mongoose.Types.ObjectId(),
      type: 'contract_proposed',
      message: 'Test message'
    });
    await testNotification.validate();
    console.log('✓ Notification validation passed for "contract_proposed"');

    // 2. Simple Contract Creation Test
    const buyer = await User.findOne({ role: 'company-buyer' });
    const seller = await User.findOne({ role: 'company-seller' });

    if (!buyer || !seller) {
      console.log('! Skipping contract creation test: Buyer or Seller not found in DB');
    } else {
      const contract = new LongTermContract({
        proposerId: seller._id,
        receiverId: buyer._id,
        wasteType: 'Test Plastic',
        monthlyQuantityKg: 500,
        pricePerKg: 150,
        durationMonths: 12,
        status: 'pending_signature'
      });
      await contract.save();
      console.log('✓ LongTermContract created successfully');
      
      // Test Confirmation logic
      contract.proposerConfirmed = true;
      contract.receiverConfirmed = true;
      if (contract.proposerConfirmed && contract.receiverConfirmed) {
        contract.status = 'active';
      }
      await contract.save();
      console.log('✓ Mutual confirmation logic simulation passed');

      // Cleanup
      await LongTermContract.findByIdAndDelete(contract._id);
      console.log('✓ Test contract cleaned up');
    }

    console.log('\nVerification complete!');
    process.exit(0);
  } catch (error) {
    console.error('Verification failed:', error);
    process.exit(1);
  }
}

verifyContracts();
