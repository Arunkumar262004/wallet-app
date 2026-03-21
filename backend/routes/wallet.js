const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { getWallet, addMoney, withdrawMoney, getPassbook } = require('../controllers/walletController');
const authMiddleware = require('../middleware/auth');

// All wallet routes require authentication
router.use(authMiddleware);

// @route   GET /api/wallet
// @desc    Get wallet balance
router.get('/', getWallet);

// @route   POST /api/wallet/add
// @desc    Add money to wallet
router.post('/add', [
  body('amount').isNumeric().withMessage('Amount must be a number').toFloat(),
], addMoney);

// @route   POST /api/wallet/withdraw
// @desc    Withdraw money from wallet
router.post('/withdraw', [
  body('amount').isNumeric().withMessage('Amount must be a number').toFloat(),
], withdrawMoney);

// @route   GET /api/wallet/passbook
// @desc    Get transaction history
router.get('/passbook', getPassbook);

module.exports = router;
