require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User');

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/wisewaste');
    console.log("Connected to MongoDB successfully.");

    // Check if admin already exists to prevent duplication crashes
    const existingAdmin = await User.findOne({ email: 'admin@gmail.com' });
    if (existingAdmin) {
       console.log("Admin already exists. Halting.");
       process.exit(0);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    const adminUser = await User.create({
      name: 'System Admin',
      email: 'admin@gmail.com',
      password: hashedPassword,
      role: 'admin',
      isApproved: true
    });

    console.log("Admin user successfully recreated:", adminUser.email);
    process.exit(0);
  } catch(e) {
    console.error("Error creating admin:", e);
    process.exit(1);
  }
};

createAdmin();
