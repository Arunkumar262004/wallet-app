import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { getWallet, addMoney, withdrawMoney } from '../common_api/api';

const fmt = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n || 0);

const ADD_PRESETS = [100, 500, 1000, 2000, 5000];
const WITHDRAW_PRESETS = [100, 200, 500, 1000];

export default function WalletPage() {
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('add');
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchWallet = async () => {
    try {
      const { data } = await getWallet();
      setWallet(data.wallet);
    } catch { toast.error('Failed to load wallet.'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    document.title = 'Wallet';
    fetchWallet();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (!val || val <= 0) { toast.error('Enter a valid amount.'); return; }
    if (tab === 'add' && val > 100000) { toast.error('Max ₹1,00,000 per transaction.'); return; }
    if (tab === 'withdraw' && wallet && val > parseFloat(wallet.balance)) {
      toast.error('Insufficient wallet balance.'); return;
    }

    setSubmitting(true);
    try {
      const fn = tab === 'add' ? addMoney : withdrawMoney;
      const { data } = await fn({ amount: val, description: desc || undefined });
      toast.success(data.message);
      setWallet(data.wallet);
      setAmount('');
      setDesc('');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Transaction failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;

  const presets = tab === 'add' ? ADD_PRESETS : WITHDRAW_PRESETS;

  return (
    <div>
      {/* Wallet hero */}
      <div className="wallet-hero mb-20">
        <div className="wallet-label"><i className="bi bi-credit-card-2-front-fill" /> Current Balance</div>
        <div className="wallet-amount">{fmt(wallet?.balance)}</div>
        <div className="wallet-sub">Wallet ID: {wallet?.id?.slice(0, 8).toUpperCase()}</div>
      </div>

      <div className="grid-2">
        {/* Transaction form */}
        <div className="card">
          {/* Tabs */}
          <div className="filter-tabs" style={{ marginBottom: 24 }}>
            <button className={`filter-tab${tab === 'add' ? ' active' : ''}`} onClick={() => { setTab('add'); setAmount(''); }}>
              <i className="bi bi-arrow-down-circle-fill" /> Add Money
            </button>
            <button className={`filter-tab${tab === 'withdraw' ? ' active' : ''}`} onClick={() => { setTab('withdraw'); setAmount(''); }}>
              <i className="bi bi-arrow-up-circle-fill" /> Withdraw
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Amount (₹)</label>
              <div className="input-group">
                <span className="input-prefix">₹</span>
                <input
                  className="form-input"
                  type="number"
                  min="1"
                  step="1"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                />
              </div>
              <div className="amount-chips mt-8">
                {presets.map(p => (
                  <button
                    key={p}
                    type="button"
                    className={`amount-chip${parseFloat(amount) === p ? ' active' : ''}`}
                    onClick={() => setAmount(String(p))}
                  >
                    ₹{p.toLocaleString('en-IN')}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Description (optional)</label>
              <input
                className="form-input"
                type="text"
                placeholder={tab === 'add' ? 'e.g. Added via UPI' : 'e.g. Bank transfer'}
                value={desc}
                onChange={e => setDesc(e.target.value)}
                maxLength={100}
              />
            </div>

            <button
              type="submit"
              className={`btn ${tab === 'add' ? 'btn-success' : 'btn-danger'} btn-full btn-lg`}
              disabled={submitting || !amount}
            >
              {submitting ? (
                <><i className="bi bi-hourglass-split" /> Processing…</>
              ) : tab === 'add' ? (
                <><i className="bi bi-plus-lg" /> Add Money</>
              ) : (
                <><i className="bi bi-box-arrow-up" /> Withdraw Money</>
              )}
            </button>
          </form>
        </div>

        <div>
          <div className="card mt-20">
            <div className="card-title"><i className="bi bi-bar-chart-fill" /> Quick Stats</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="flex-between">
                <span className="text-muted text-sm">Current Balance</span>
                <strong style={{ color: 'var(--primary)' }}>{fmt(wallet?.balance)}</strong>
              </div>
              <hr className="divider" style={{ margin: '0' }} />
              <div className="flex-between">
                <span className="text-muted text-sm">Wallet Created</span>
                <span className="text-sm">{wallet?.created_at ? new Date(wallet.created_at).toLocaleDateString('en-IN') : '—'}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}