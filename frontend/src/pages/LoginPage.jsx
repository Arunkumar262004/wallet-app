import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { checkUser, sendOTP, verifyOTP } from '../common_api/api';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState('mobile');
  const [mobile, setMobile] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isNewUser, setIsNewUser] = useState(false);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [mobileError, setMobileError] = useState('');
  const otpRefs = useRef([]);

  const startCountdown = (seconds = 60) => {
    setCountdown(seconds);
    const id = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(id); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    document.title = 'Login';
  }, []);


  const handleMobileSubmit = async (e) => {
    e.preventDefault();
    setMobileError('');
    if (!/^[6-9]\d{9}$/.test(mobile)) { setMobileError('Enter a valid 10-digit Indian mobile number.'); return; }
    setLoading(true);
    try {
      const { data } = await checkUser(mobile);
      setIsNewUser(!data.exists);
      if (!data.exists) { setStep('name'); } else { await doSendOTP(); }
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleNameSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || name.trim().length < 2) { toast.error('Please enter your full name.'); return; }
    await doSendOTP();
  };

  const doSendOTP = async () => {
    setLoading(true);
    try {
      const { data } = await sendOTP(mobile);
      toast.success(data.message || 'OTP sent!');
      if (data.otp) { const digits = data.otp.split(''); setOtp(digits); toast(`Your OTP Is: ${data.otp}`); }
      setStep('otp');
      startCountdown();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (idx, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp]; next[idx] = val; setOtp(next);
    if (val && idx < 5) otpRefs.current[idx + 1]?.focus();
  };

  const handleOtpKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) otpRefs.current[idx - 1]?.focus();
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) { setOtp(pasted.split('')); otpRefs.current[5]?.focus(); }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length !== 6) { toast.error('Enter the 6-digit OTP.'); return; }
    setLoading(true);
    try {
      const payload = { mobile, otp: code };
      if (isNewUser) payload.name = name;
      const { data } = await verifyOTP(payload);
      login(data.token, data.user);
      toast.success(data.message || 'Welcome!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Invalid OTP.');
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">

        {/* Logo */}
        <div className="login-logo">
          <div className="logo-icon" />
          <h1>Wallet App</h1>
          <p>Your digital wallet, simplified</p>
        </div>

        {/* ── Mobile Step ── */}
        {step === 'mobile' && (
          <form onSubmit={handleMobileSubmit}>
            <div className="form-group">
              <label className="form-label">Mobile Number</label>
              <div className="input-group">
                <span className="input-prefix"><i className="bi bi-phone-fill" /></span>
                <input
                  className={`form-input${mobileError ? ' error' : ''}`}
                  type="tel"
                  maxLength={10}
                  placeholder="Enter 10-digit number"
                  value={mobile}
                  onChange={e => { setMobile(e.target.value.replace(/\D/g, '')); setMobileError(''); }}
                  autoFocus
                />
              </div>
              {mobileError && <div className="form-error">{mobileError}</div>}
            </div>
            <button className="btn btn-primary btn-full btn-lg" type="submit" disabled={loading}>
              {loading ? 'Checking…' : <>Continue <i className="bi bi-arrow-right" /></>}
            </button>
          </form>
        )}

        {/* ── Name Step (new user) ── */}
        {step === 'name' && (
          <form onSubmit={handleNameSubmit}>
            <div className="alert alert-info">
              <i className="bi bi-hand-wave" /> Welcome! You're new here. Tell us your name.
            </div>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div className="input-group">
                <span className="input-prefix"><i className="bi bi-person-fill" /></span>
                <input
                  className="form-input"
                  type="text"
                  placeholder="Your full name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  autoFocus
                />
              </div>
            </div>
            <div className="flex gap-8">
              <button type="button" className="btn btn-outline" onClick={() => setStep('mobile')}>
                <i className="bi bi-arrow-left" /> Back
              </button>
              <button className="btn btn-primary" style={{ flex: 1 }} type="submit" disabled={loading}>
                {loading ? 'Sending OTP…' : 'Send OTP'}
              </button>
            </div>
          </form>
        )}

        {/* ── OTP Step ── */}
        {step === 'otp' && (
          <form onSubmit={handleOtpSubmit}>
            <p className="text-center text-sm text-muted mb-16">
              OTP sent to <strong>+91 {mobile}</strong>
              {isNewUser && <> · Hi <strong>{name}</strong>!</>}
            </p>
            <div className="otp-row">
              {otp.map((d, i) => (
                <input
                  key={i}
                  ref={el => (otpRefs.current[i] = el)}
                  className="otp-box"
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={e => handleOtpChange(i, e.target.value)}
                  onKeyDown={e => handleOtpKeyDown(i, e)}
                  onPaste={i === 0 ? handleOtpPaste : undefined}
                />
              ))}
            </div>
            <button className="btn btn-primary btn-full btn-lg mt-16" type="submit" disabled={loading}>
              {loading ? 'Verifying…' : <><i className="bi bi-check-lg" /> Verify OTP</>}
            </button>
            <div className="text-center mt-12 text-sm text-muted">
              {countdown > 0 ? (
                <><i className="bi bi-clock" /> Resend in <strong>{countdown}s</strong></>
              ) : (
                <button type="button" style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }} onClick={doSendOTP} disabled={loading}>
                  <i className="bi bi-arrow-repeat" /> Resend OTP
                </button>
              )}
            </div>
            <div className="text-center mt-8">
              <button type="button" className="text-sm text-muted" style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => { setStep('mobile'); setOtp(['', '', '', '', '', '']); }}>
                <i className="bi bi-arrow-left" /> Change number
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}