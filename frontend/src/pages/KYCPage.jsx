import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { submitKYC, getKYCStatus } from '../common_api/api';

const STATUS_CONFIG = {
  pending:   { label: 'Not Submitted', color: 'badge-warning',   icon: 'bi-hourglass-split'    },
  submitted: { label: 'Under Review',  color: 'badge-submitted', icon: 'bi-arrow-repeat'        },
  approved:  { label: 'Approved',      color: 'badge-approved',  icon: 'bi-patch-check-fill'    },
  rejected:  { label: 'Rejected',      color: 'badge-rejected',  icon: 'bi-x-circle-fill'       },
};

// KYC steps shown in the right column
const KYC_STEPS = [
  { step: 1, title: 'Submit Documents',  desc: 'Enter your Aadhaar and PAN details.'          },
  { step: 2, title: 'Verification',      desc: 'We verify your details via UIDAI API.'        },
  { step: 3, title: 'Unlock Full Access',desc: 'Get higher limits and all features unlocked.' },
];

// Which steps are considered "done" for each status
const isDone = (stepNumber, status) => {
  if (stepNumber === 1) return ['submitted', 'approved', 'rejected'].includes(status);
  if (stepNumber === 2) return status === 'approved';
  if (stepNumber === 3) return status === 'approved';
  return false;
};

export default function KYCPage() {
  const [kyc,        setKyc]        = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [aadhaar,    setAadhaar]    = useState('');
  const [pan,        setPan]        = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Load KYC status on mount
  const fetchKYC = async () => {
    try {
      const { data } = await getKYCStatus();
      setKyc(data.kyc);
    } catch {
      toast.error('Failed to load KYC status.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKYC();
  }, []);

  // Poll every 3 seconds while status is 'submitted'
  useEffect(() => {
     document.title = 'KYC - Verification';
    if (kyc?.status !== 'submitted') return;

    const interval = setInterval(async () => {
      try {
        const { data } = await getKYCStatus();
        setKyc(data.kyc);
        if (data.kyc.status === 'approved') {
          clearInterval(interval);
          toast.success('KYC Approved! Full wallet access unlocked.');
        }
      } catch {
        clearInterval(interval);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [kyc?.status]);

  // Validate and submit KYC form
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!/^\d{12}$/.test(aadhaar)) {
      toast.error('Aadhaar must be 12 digits.');
      return;
    }
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan.toUpperCase())) {
      toast.error('Invalid PAN format (e.g. ABCDE1234F).');
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await submitKYC({ aadhaar, pan: pan.toUpperCase() });
      toast.success(data.message);
      await fetchKYC();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'KYC submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;

  const statusConfig = STATUS_CONFIG[kyc?.status] || STATUS_CONFIG.pending;
  const submittedDate = kyc?.submitted_at
    ? new Date(kyc.submitted_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  return (
    <div>

      {/* ── Status Banner ── */}
      <div className="card mb-20">
        <div className="flex-between" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div className="card-title" style={{ marginBottom: 6 }}>KYC Verification Status</div>
            <span className={`badge ${statusConfig.color}`} style={{ fontSize: '.88rem', padding: '5px 14px' }}>
              <i className={`bi ${statusConfig.icon}`} /> {statusConfig.label}
            </span>
            {submittedDate && (
              <div className="text-sm text-muted mt-8">Submitted on {submittedDate}</div>
            )}
          </div>
          {kyc?.status === 'approved' && (
            <i className="bi bi-patch-check-fill" style={{ fontSize: '3rem', color: 'var(--success)' }} />
          )}
        </div>

        {/* Show submitted Aadhaar & PAN */}
        {kyc?.aadhaar && (
          <div className="grid-2 mt-16">
            <div style={{ background: 'var(--bg)', padding: '12px 16px', borderRadius: 'var(--radius-sm)' }}>
              <div className="text-sm text-muted">Aadhaar</div>
              <div style={{ fontWeight: 700, fontFamily: 'monospace', marginTop: 4 }}>{kyc.aadhaar}</div>
            </div>
            <div style={{ background: 'var(--bg)', padding: '12px 16px', borderRadius: 'var(--radius-sm)' }}>
              <div className="text-sm text-muted">PAN</div>
              <div style={{ fontWeight: 700, fontFamily: 'monospace', marginTop: 4 }}>{kyc.pan}</div>
            </div>
          </div>
        )}
      </div>

      <div className="grid-2">

        {/* ── Submit / Re-submit Form ── */}
        {(kyc?.status === 'pending' || kyc?.status === 'rejected') && (
          <div className="card">
            <div className="card-title">
              {kyc?.status === 'rejected'
                ? <><i className="bi bi-arrow-repeat" /> Re-submit KYC</>
                : <><i className="bi bi-clipboard-fill" /> Submit KYC Details</>
              }
            </div>

            {kyc?.status === 'rejected' && (
              <div className="alert alert-danger">
                <i className="bi bi-exclamation-triangle-fill" /> Your KYC was rejected. Please check and resubmit correct details.
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Aadhaar Number</label>
                <input
                  className="form-input"
                  type="text"
                  inputMode="numeric"
                  maxLength={12}
                  placeholder="12-digit Aadhaar number"
                  value={aadhaar}
                  onChange={e => setAadhaar(e.target.value.replace(/\D/g, ''))}
                />
                <div className="form-hint">Enter your 12-digit Aadhaar number without spaces</div>
              </div>

              <div className="form-group">
                <label className="form-label">PAN Number</label>
                <input
                  className="form-input"
                  type="text"
                  maxLength={10}
                  placeholder="e.g. ABCDE1234F"
                  value={pan}
                  onChange={e => setPan(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                />
                <div className="form-hint">Format: 5 letters + 4 digits + 1 letter</div>
              </div>

              <div className="alert alert-info">
                <i className="bi bi-shield-lock-fill" /> Your data is encrypted and securely stored. We never share your information with third parties.
              </div>

              <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={submitting}>
                {submitting
                  ? <><i className="bi bi-hourglass-split" /> Submitting…</>
                  : <><i className="bi bi-shield-lock-fill" /> Submit for Verification</>
                }
              </button>
            </form>
          </div>
        )}

        {/* ── Verification In Progress ── */}
        {kyc?.status === 'submitted' && (
          <div className="card">
            <div className="card-title"><i className="bi bi-arrow-repeat" /> Verification in Progress</div>
            <div className="text-center" style={{ padding: '32px 0' }}>
              <i className="bi bi-hourglass-split" style={{ fontSize: '3rem', marginBottom: 16, display: 'block' }} />
              <div style={{ fontWeight: 600, marginBottom: 8 }}>Verifying your documents…</div>
              <div className="text-sm text-muted">This usually takes a few seconds in demo mode. In production, expect 24–48 hours.</div>
              <div className="page-loader mt-20"><div className="spinner" /></div>
            </div>
          </div>
        )}

        {/* ── Approved ── */}
        {kyc?.status === 'approved' && (
          <div className="card">
            <div className="card-title"><i className="bi bi-patch-check-fill" /> KYC Verified</div>
            <div className="text-center" style={{ padding: '32px 0' }}>
              <i className="bi bi-patch-check-fill" style={{ fontSize: '4rem', marginBottom: 16, display: 'block', color: 'var(--success)' }} />
              <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 8 }}>You're fully verified!</div>
              <div className="text-sm text-muted">All wallet features and higher limits are now unlocked.</div>
            </div>
          </div>
        )}

        {/* ── KYC Steps ── */}
        <div className="card" style={{ height: 'fit-content' }}>
          <div className="card-title"><i className="bi bi-list-check" /> KYC Process</div>
          {KYC_STEPS.map(({ step, title, desc }) => {
            const done = isDone(step, kyc?.status);
            return (
              <div key={step} className="kyc-step">
                <div className={`kyc-step-num${done ? ' done' : ''}`}>
                  {done ? <i className="bi bi-check-lg" /> : step}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '.92rem' }}>{title}</div>
                  <div className="text-sm text-muted mt-8">{desc}</div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}