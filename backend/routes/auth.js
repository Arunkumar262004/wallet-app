const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { sendOTP, verifyOTP, checkUser, getProfile, updateProfile } = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');

// @route   POST /api/auth/check-user
// @desc    Check if user exists
// @access  Public
router.post('/check-user', [
  body('mobile').notEmpty().withMessage('Mobile is required'),
], checkUser);

// @route   POST /api/auth/send-otp
// @desc    Send OTP to mobile number
// @access  Public
router.post('/send-otp', [
  body('mobile').notEmpty().withMessage('Mobile number is required'),
], sendOTP);

// @route   POST /api/auth/verify-otp
// @desc    Verify OTP and login/register
// @access  Public
router.post('/verify-otp', [
  body('mobile').notEmpty().withMessage('Mobile is required'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
], verifyOTP);

// @route   GET /api/auth/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', authMiddleware, getProfile);

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', authMiddleware, [
  body('email').optional().isEmail().withMessage('Invalid email'),
], updateProfile);

module.exports = router;
