// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Validate Indian mobile number
const isValidMobile = (mobile) => {
  return /^[6-9]\d{9}$/.test(mobile);
};

// Format currency to INR
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(amount);
};

// Paginate helper
const getPaginationMeta = (count, page, limit) => ({
  total_records: count,
  total_pages: Math.ceil(count / limit),
  current_page: parseInt(page),
  per_page: parseInt(limit),
  has_next: page < Math.ceil(count / limit),
  has_prev: page > 1,
});

module.exports = { generateOTP, isValidMobile, formatCurrency, getPaginationMeta };
