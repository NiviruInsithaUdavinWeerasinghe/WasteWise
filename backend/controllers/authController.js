const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, companyDetails, phoneNumber, address } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Please add all fields' });
    }

    if (role === 'admin') {
      return res.status(403).json({ message: 'Admin registration is not allowed' });
    }

    const validRoles = ['company-seller', 'company-buyer', 'individual', 'deliveryman'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    if (role === 'company-seller') {
      if (!companyDetails || !companyDetails.brNumber) {
        return res.status(400).json({ message: 'Business Registration Number is required for sellers' });
      }
    }

    if (role === 'deliveryman') {
      if (!phoneNumber || !address) {
        return res.status(400).json({ message: 'Phone number and address are required for deliverymen' });
      }
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // company-seller and deliveryman need admin approval
    const isApproved = (role === 'company-seller' || role === 'deliveryman') ? false : true;

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      isApproved,
      phoneNumber,
      address,
      companyDetails: role === 'company-seller' ? companyDetails : undefined
    });

    if (user) {

      res.status(201).json({
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved,
        companyDetails: user.companyDetails,
        profilePhoto: user.profilePhoto,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {

      res.json({
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved,
        companyDetails: user.companyDetails,
        profilePhoto: user.profilePhoto,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);

    if (user && (await bcrypt.compare(currentPassword, user.password))) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
      await user.save();

      // Log the password change
      await AuditLog.create({
        userId: user._id,
        action: 'Password Changed',
        details: `${user.name} has successfully updated their account password.`,
        type: 'account_update'
      });

      res.json({ message: 'Password changed successfully' });
    } else {
      res.status(401).json({ message: 'Invalid current password' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error changing password' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  generateToken,
  changePassword,
};
