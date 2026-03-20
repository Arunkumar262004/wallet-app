require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { connectDB } = require('./config/database');

// Register models and associations
require('./models/User');
require('./models/Wallet');
require('./models/Transaction');
require('./models/OTP');

// Routes
const authRoutes = require('./routes/auth');
const walletRoutes = require('./routes/wallet');
const kycRoutes = require('./routes/kyc');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/kyc', kycRoutes);


// 404 handler
app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found.' }));

// error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ success: false, message: 'Internal server error.' });
});

// Start server
connectDB().then(() => app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`)));