import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getWallet, getPassbook, getKYCStatus } from '../common_api/api';

const fmt = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n);

export default function DashboardPage() {
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const [wallet,   setWallet]   = useState(null);
  const [summary,  setSummary]  = useState(null);
  const [recent,   setRecent]   = useState([]);
  const [kyc,      setKyc]      = useState(null);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
     document.title = 'Dashboard';
    (async () => {
      try {
        const [wal, pass, kyc_data] = await Promise.all([getWallet(), getPassbook({ limit: 5 }), getKYCStatus()]);
        setWallet(wal.data.wallet);
        setSummary(pass.data.summary);
        setRecent(pass.data.transactions);
        setKyc(kyc_data.data.kyc);
      } catch { /* handled by interceptor */ }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div>
      {/* Greeting */}
      <div className="mb-20">
        <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>
          {greeting}, {user?.name?.split(' ')[0] || 'there'}!
        </h2>
        <p className="text-muted text-sm mt-8">Here's your wallet summary for today.</p>
      </div>

      {/* KYC banner */}
      {kyc?.status !== 'approved' && (
        <div className="alert alert-warning mb-20" style={{ cursor: 'pointer' }} onClick={() => navigate('/kyc')}>
          <i className="bi bi-exclamation-triangle-fill" />
          <div>
            <strong>Complete KYC Verification</strong>
            <div className="text-sm mt-8">Your account has limits until KYC is verified. <u>Complete now →</u></div>
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid-4 mb-20">
        <div className="stat-card">
          <div className="stat-icon purple"><i className="bi bi-wallet2" /></div>
          <div>
            <div className="stat-label">Wallet Balance</div>
            <div className="stat-value">{wallet ? fmt(wallet.balance) : '—'}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><i className="bi bi-graph-up-arrow" /></div>
          <div>
            <div className="stat-label">Total Credited</div>
            <div className="stat-value">{summary ? fmt(summary.total_credited || 0) : '—'}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red"><i className="bi bi-graph-down-arrow" /></div>
          <div>
            <div className="stat-label">Total Debited</div>
            <div className="stat-value">{summary ? fmt(summary.total_debited || 0) : '—'}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange"><i className="bi bi-arrow-left-right" /></div>
          <div>
            <div className="stat-label">Total Transactions</div>
            <div className="stat-value">{summary?.total_transactions ?? '—'}</div>
          </div>
        </div>
      </div>

      <div className="grid-2">
        {/* Wallet card */}
        <div>
          <div className="wallet-hero">
            <div className="wallet-label">Available Balance</div>
            <div className="wallet-amount">{wallet ? fmt(wallet.balance) : '₹0.00'}</div>
            <div className="wallet-sub">+91 {user?.mobile}</div>
            <div className="wallet-actions">
              <button className="btn btn-ghost" onClick={() => navigate('/wallet')}><i className="bi bi-plus-lg" /> Add Money</button>
              <button className="btn btn-ghost" onClick={() => navigate('/wallet')}><i className="bi bi-box-arrow-up" /> Withdraw</button>
            </div>
          </div>

          {/* Quick actions */}
         
        </div>

        {/* Recent transactions */}
        <div className="card" style={{ height: 'fit-content' }}>
          <div className="flex-between mb-16">
            <div className="card-title" style={{ margin: 0 }}>Recent Transactions</div>
            <button className="btn btn-outline btn-sm" onClick={() => navigate('/passbook')}>View All</button>
          </div>

          {recent.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><i className="bi bi-inbox" /></div>
              <div className="empty-title">No transactions yet</div>
              <div className="empty-desc">Add money to your wallet to get started</div>
            </div>
          ) : (
            <div className="tx-list">
              {recent.map(tx => (
                <div key={tx.id} className="tx-item">
                  <div className={`tx-icon ${tx.type}`}>
                    <i className={`bi ${tx.type === 'credit' ? 'bi-arrow-down-circle-fill' : 'bi-arrow-up-circle-fill'}`} />
                  </div>
                  <div className="tx-info">
                    <div className="tx-desc">{tx.description}</div>
                    <div className="tx-date">{new Date(tx.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                  <div className={`tx-amount ${tx.type}`}>
                    {tx.type === 'credit' ? '+' : '-'}{fmt(tx.amount)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}