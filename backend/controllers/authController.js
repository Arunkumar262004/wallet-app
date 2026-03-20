const jwt    = require('jsonwebtoken');
const { Op } = require('sequelize');
const User   = require('../models/User');
const Wallet = require('../models/Wallet');
const OTP    = require('../models/OTP');
const { generateOTP, isValidMobile } = require('../common_api/helpers');

// JWT token with expiry
const signToken = (userId) => jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// Fetch user with wallet
const getUserWithWallet = (userId) => User.findByPk(userId, { attributes: { exclude: ['password'] }, include: [{ model: Wallet, as: 'wallet' }] });

// POST /auth/send-otp
const sendOTP = async (req, res) => {
  try {
    const { mobile } = req.body;
    if (!isValidMobile(mobile)) return res.status(400).json({ success: false, message: 'Invalid mobile number.' });

    // Invalidate old 
    // if wrong create new one
    await OTP.update({ is_used: true }, { where: { mobile, is_used: false } });
    const otp       = generateOTP();
    const expiresAt = new Date(Date.now() + parseInt(process.env.OTP_EXPIRES_IN || '300000'));
    await OTP.create({ mobile, otp, expires_at: expiresAt });

    // SMS
    console.log(`OTP for ${mobile}: ${otp}`);
    res.json({ success: true, message: 'OTP sent successfully.', otp: process.env.NODE_ENV === 'development' ? otp : undefined });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to send OTP.', error: error.message });
  }
};

// POST /auth/verify-otp — Verify OTP, login or register user
const verifyOTP = async (req, res) => {
  try {
    const { mobile, otp, name } = req.body;
    if (!isValidMobile(mobile)) return res.status(400).json({ success: false, message: 'Invalid mobile number.' });

    // Find valid unused non-expired OTP
    const otpRecord = await OTP.findOne({
      where: { mobile, otp, is_used: false, expires_at: { [Op.gt]: new Date() } },
      order: [['created_at', 'DESC']],
    });
    if (!otpRecord) return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });

    // Mark OTP used so it cannot be reused
    await otpRecord.update({ is_used: true });

    let user      = await User.findOne({ where: { mobile } });
    let isNewUser = false;

    if (!user) {
      // New user — name required for registration
      if (!name) return res.status(400).json({ success: false, message: 'Name is required for new user registration.', requires_name: true });
      user      = await User.create({ mobile, name, is_verified: true });
      isNewUser = true;
      await Wallet.create({ user_id: user.id, balance: 0.00 });
    } else {
      await user.update({ is_verified: true });
    }

    const token    = signToken(user.id);
    const userData = await getUserWithWallet(user.id);
    res.json({ success: true, message: isNewUser ? 'Registration successful.' : 'Login successful.', token, user: userData, is_new_user: isNewUser });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Verification failed.', error: error.message });
  }
};

// POST /auth/check-user — Check if mobile is already registered
const checkUser = async (req, res) => {
  try {
    const { mobile } = req.body;
    if (!isValidMobile(mobile)) return res.status(400).json({ success: false, message: 'Invalid mobile number.' });
    const user = await User.findOne({ where: { mobile } });
    res.json({ success: true, exists: !!user, message: user ? 'User found. Please login.' : 'New user. Please register.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error checking user.', error: error.message });
  }
};

// GET /auth/profile — Get logged-in user profile with wallet
const getProfile = async (req, res) => {
  try {
    const user = await getUserWithWallet(req.user.id);
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch profile.', error: error.message });
  }
};

// PUT /auth/profile — Update logged-in user name or email
const updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    const updateData = {};
    if (name)  updateData.name  = name;
    if (email) updateData.email = email;
    await User.update(updateData, { where: { id: req.user.id } });
    const updatedUser = await getUserWithWallet(req.user.id);
    res.json({ success: true, message: 'Profile updated.', user: updatedUser });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update profile.', error: error.message });
  }
};

module.exports = { sendOTP, verifyOTP, checkUser, getProfile, updateProfile };