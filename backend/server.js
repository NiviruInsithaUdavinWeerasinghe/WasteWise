require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const listingRoutes = require('./routes/listingRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const agreementRoutes = require('./routes/agreementRoutes');
const contractRoutes = require('./routes/contractRoutes');
const startCronJobs = require('./cronJobs');

const app = express();

app.use(express.json());
app.use(cors());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/agreements', agreementRoutes);
app.use('/api/contracts', contractRoutes);

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/wisewaste';

// Start server first so we don't get ERR_CONNECTION_REFUSED
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    startCronJobs();

    // Seed admin account
    const User = require('./models/User');
    const bcrypt = require('bcrypt');

    const adminExists = await User.findOne({ email: 'admin@wastewise.com' });
    if (!adminExists) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('adminpassword', salt);
      await User.create({
        name: 'System Admin',
        email: 'admin@wastewise.com',
        password: hashedPassword,
        role: 'admin',
        isApproved: true
      });
      console.log('Admin account created: admin@wastewise.com / adminpassword');
    }
  })
  .catch(err => {
    console.error('MongoDB connection error. Please ensure MongoDB is running!');
    console.error(err.message);
  });
