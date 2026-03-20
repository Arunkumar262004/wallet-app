import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { updateProfile } from '../common_api/api';

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'badge-pending' },
  submitted: { label: 'Under Review', color: 'badge-submitted' },
  approved: { label: 'Approved', color: 'badge-approved' },
  rejected: { label: 'Rejected', color: 'badge-rejected' },
};

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => {
    document.title = 'My Profile';
  }, []);

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : user?.mobile?.slice(-2) || 'U';

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) { toast.error('Name cannot be empty.'); return; }
    setSubmitting(true);
    try {
      const { data } = await updateProfile({ name: name.trim(), email: email.trim() || undefined });
      updateUser(data.user);
      toast.success('Profile updated!');
      setEditing(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Update failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const kycCfg = STATUS_CONFIG[user?.kyc_status] || STATUS_CONFIG.pending;

  return (
    <div>
      {/* Profile header */}
      <div className="profile-header">
        <div className="profile-avatar">{initials}</div>
        <div>
          <div className="profile-name">{user?.name || 'User'}</div>
          <div className="profile-mobile"><i className="bi bi-phone-fill" /> +91 {user?.mobile}</div>
          {user?.email && <div className="profile-mobile" style={{ marginTop: 2 }}><i className="bi bi-envelope-fill" /> {user.email}</div>}
          <div className="mt-8">
            <span className={`badge ${kycCfg.color}`}>{kycCfg.label} KYC</span>
          </div>
        </div>
      </div>

      <div className="">
        {/* Edit form */}
        <div className="card">
          <div className="flex-between mb-16">
            <div className="card-title" style={{ margin: 0 }}>Personal Information</div>
            {!editing && (
              <button className="btn btn-outline btn-sm" onClick={() => setEditing(true)}><i className="bi bi-pencil-fill" /> Edit</button>
            )}
          </div>

          {editing ? (
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-input" type="text" value={name} onChange={e => setName(e.target.value)} autoFocus />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input className="form-input" type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Mobile Number</label>
                <input className="form-input" type="text" value={`+91 ${user?.mobile}`} disabled style={{ opacity: .6 }} />
                <div className="form-hint">Mobile number cannot be changed.</div>
              </div>
              <div className="flex gap-8">
                <button type="button" className="btn btn-outline" onClick={() => { setEditing(false); setName(user?.name || ''); setEmail(user?.email || ''); }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={submitting}>
                  {submitting ? 'Saving…' : <><i className="bi bi-floppy-fill" /> Save Changes</>}
                </button>
              </div>
            </form>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { label: 'Full Name', value: user?.name || '—' },
                { label: 'Mobile', value: `+91 ${user?.mobile}` },
                { label: 'Email', value: user?.email || 'Not added' },
              ].map(({ label, value }) => (
                <div key={label} className="flex-between">
                  <span className="text-sm text-muted">{label}</span>
                  <span style={{ fontWeight: 600, fontSize: '.92rem' }}>{value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}