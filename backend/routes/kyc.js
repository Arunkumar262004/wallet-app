const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { submitKYC, getKYCStatus } = require('../controllers/kycController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// @route   POST /api/kyc/submit
// @desc    Submit KYC details
// @access  Private
router.post('/submit', [
  body('aadhaar').notEmpty().withMessage('Aadhaar number is required'),
  body('pan').notEmpty().withMessage('PAN number is required'),
], submitKYC);

// @route   GET /api/kyc/status
// @desc    Get KYC status
// @access  Private
router.get('/status', getKYCStatus);

module.exports = router;
