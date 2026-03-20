const { sequelize } = require('../config/database');
const Wallet        = require('../models/Wallet');
const Transaction   = require('../models/Transaction');
const { v4: uuidv4 } = require('uuid');

// Generate a short unique reference ID with a prefix (e.g. ADD-A1B2C3D4)
const generateRefId = (prefix) => `${prefix}-${uuidv4().split('-')[0].toUpperCase()}`;

// GET /wallet — Get logged-in user's wallet
const getWallet = async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ where: { user_id: req.user.id } });
    if (!wallet) return res.status(404).json({ success: false, message: 'Wallet not found.' });
    res.json({ success: true, wallet });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch wallet.', error: error.message });
  }
};

// POST /wallet/add — Add money to wallet
const addMoney = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { amount, description } = req.body;
    const parsedAmount = parseFloat(amount);

    if (!parsedAmount || parsedAmount <= 0 || parsedAmount > 100000) {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'Invalid amount. Must be between ₹1 and ₹1,00,000.' });
    }

    const wallet = await Wallet.findOne({ where: { user_id: req.user.id }, lock: t.LOCK.UPDATE, transaction: t });
    if (!wallet) {
      await t.rollback();
      return res.status(404).json({ success: false, message: 'Wallet not found.' });
    }

    const newBalance = parseFloat(wallet.balance) + parsedAmount;
    await wallet.update({ balance: newBalance }, { transaction: t });

    const txn = await Transaction.create({
      wallet_id:    wallet.id,
      type:         'credit',
      amount:       parsedAmount,
      balance_after: newBalance,
      description:  description || 'Added money to wallet',
      reference_id: generateRefId('ADD'),
      status:       'success',
    }, { transaction: t });

    await t.commit();
    res.json({ success: true, message: `₹${parsedAmount.toFixed(2)} added successfully.`, wallet: { ...wallet.toJSON(), balance: newBalance }, transaction: txn });
  } catch (error) {
    await t.rollback();
    res.status(500).json({ success: false, message: 'Failed to add money.', error: error.message });
  }
};

// POST /wallet/withdraw — Withdraw money from wallet
const withdrawMoney = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { amount, description } = req.body;
    const parsedAmount = parseFloat(amount);

    if (!parsedAmount || parsedAmount <= 0) {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'Invalid amount.' });
    }

    const wallet = await Wallet.findOne({ where: { user_id: req.user.id }, lock: t.LOCK.UPDATE, transaction: t });
    if (!wallet) {
      await t.rollback();
      return res.status(404).json({ success: false, message: 'Wallet not found.' });
    }

    if (parseFloat(wallet.balance) < parsedAmount) {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'Insufficient balance.' });
    }

    const newBalance = parseFloat(wallet.balance) - parsedAmount;
    await wallet.update({ balance: newBalance }, { transaction: t });

    const txn = await Transaction.create({
      wallet_id:    wallet.id,
      type:         'debit',
      amount:       parsedAmount,
      balance_after: newBalance,
      description:  description || 'Withdrawal from wallet',
      reference_id: generateRefId('WD'),
      status:       'success',
    }, { transaction: t });

    await t.commit();
    res.json({ success: true, message: `₹${parsedAmount.toFixed(2)} withdrawn successfully.`, wallet: { ...wallet.toJSON(), balance: newBalance }, transaction: txn });
  } catch (error) {
    await t.rollback();
    res.status(500).json({ success: false, message: 'Failed to withdraw.', error: error.message });
  }
};

// GET /wallet/passbook — Get paginated transaction history with summary
const getPassbook = async (req, res) => {
  try {
    const { page = 1, limit = 10, type } = req.query;
    const offset = (page - 1) * limit;

    const wallet = await Wallet.findOne({ where: { user_id: req.user.id } });
    if (!wallet) return res.status(404).json({ success: false, message: 'Wallet not found.' });

    // Filter by type (credit/debit) if provided
    const whereClause = { wallet_id: wallet.id };
    if (type && ['credit', 'debit'].includes(type)) whereClause.type = type;

    const { count, rows: transactions } = await Transaction.findAndCountAll({
      where: whereClause,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    // get totals using raw SQL 
    const [summary] = await sequelize.query(
      `SELECT
        SUM(CASE WHEN type = 'credit' THEN amount ELSE 0 END) AS total_credited,
        SUM(CASE WHEN type = 'debit'  THEN amount ELSE 0 END) AS total_debited,
        COUNT(*) AS total_transactions
       FROM transactions WHERE wallet_id = :walletId`,
      { replacements: { walletId: wallet.id }, type: sequelize.QueryTypes.SELECT }
    );

    res.json({
      success: true,
      transactions,
      summary,
      pagination: {
        current_page:  parseInt(page),
        total_pages:   Math.ceil(count / limit),
        total_records: count,
        per_page:      parseInt(limit),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch transactions.', error: error.message });
  }
};

module.exports = { getWallet, addMoney, withdrawMoney, getPassbook };