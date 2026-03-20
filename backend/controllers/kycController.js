const User = require('../models/User');

// Submit KYC details
const submitKYC = async (req, res) => {
  try {
    const { aadhaar, pan } = req.body;
    const userId = req.user.id;

    const user = await User.findByPk(userId);

    if (user.kyc_status === 'approved') {
      return res.status(400).json({ success: false, message: 'KYC already approved.' });
    }

    // Basic validations
    if (!aadhaar || !/^\d{12}$/.test(aadhaar)) {
      return res.status(400).json({ success: false, message: 'Invalid Aadhaar number. Must be 12 digits.' });
    }
    if (!pan || !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan.toUpperCase())) {
      return res.status(400).json({ success: false, message: 'Invalid PAN format. Example: ABCDE1234F' });
    }

    // Check if Aadhaar/PAN already used by another user
    const existingAadhaar = await User.findOne({
      where: { kyc_aadhaar: aadhaar },
    });
    if (existingAadhaar && existingAadhaar.id !== userId) {
      return res.status(400).json({ success: false, message: 'Aadhaar already registered with another account.' });
    }

    const existingPAN = await User.findOne({
      where: { kyc_pan: pan.toUpperCase() },
    });
    if (existingPAN && existingPAN.id !== userId) {
      return res.status(400).json({ success: false, message: 'PAN already registered with another account.' });
    }

    await user.update({
      kyc_aadhaar: aadhaar,
      kyc_pan: pan.toUpperCase(),
      kyc_status: 'submitted',
      kyc_submitted_at: new Date(),
    });

    // NOTE: In production, call UIDAI API here for real verification
    // For demo: auto-approve after 5 seconds (simulate async verification)
    setTimeout(async () => {
      try {
        await User.update({ kyc_status: 'approved' }, { where: { id: userId } });
        console.log(`KYC auto-approved for user: ${userId}`);
      } catch (err) {
        console.error('KYC auto-approve error:', err.message);
      }
    }, 5000);

    res.json({
      success: true,
      message: 'KYC submitted successfully. Verification in progress.',
      kyc_status: 'submitted',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'KYC submission failed.', error: error.message });
  }
};

// Get KYC status
const getKYCStatus = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'kyc_status', 'kyc_submitted_at', 'kyc_aadhaar', 'kyc_pan'],
    });

    // Make real world bank model aadhar data
    const maskedAadhaar = user.kyc_aadhaar
      ? `XXXX XXXX ${user.kyc_aadhaar.slice(-4)}`
      : null;
    const maskedPAN = user.kyc_pan
      ? `${user.kyc_pan.slice(0, 2)}XXX${user.kyc_pan.slice(-4)}`
      : null;

    res.json({
      success: true,
      kyc: {
        status: user.kyc_status,
        submitted_at: user.kyc_submitted_at,
        aadhaar: maskedAadhaar,
        pan: maskedPAN,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch KYC status.', error: error.message });
  }
};

module.exports = { submitKYC, getKYCStatus };
