import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Auth
export const checkUser     = (mobile) => API.post('/auth/check-user', { mobile });
export const sendOTP       = (mobile) => API.post('/auth/send-otp', { mobile });
export const verifyOTP     = (data)   => API.post('/auth/verify-otp', data);
export const getProfile    = ()       => API.get('/auth/profile');
export const updateProfile = (data)   => API.put('/auth/profile', data);

// Wallet
export const getWallet      = ()       => API.get('/wallet');
export const addMoney       = (data)   => API.post('/wallet/add', data);
export const withdrawMoney  = (data)   => API.post('/wallet/withdraw', data);
export const getPassbook    = (params) => API.get('/wallet/passbook', { params });

// KYC
export const submitKYC   = (data) => API.post('/kyc/submit', data);
export const getKYCStatus = ()    => API.get('/kyc/status');

export default API;
