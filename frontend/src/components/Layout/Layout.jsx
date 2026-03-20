import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const NAV = [
  { to: '/dashboard', icon: 'bi-house-door-fill', label: 'Dashboard' },
  { to: '/wallet', icon: 'bi-credit-card-2-front-fill', label: 'Wallet' },
  { to: '/passbook', icon: 'bi-journal-text', label: 'Passbook' },
  { to: '/kyc', icon: 'bi-shield-lock-fill', label: 'KYC Verification' },
  { to: '/profile', icon: 'bi-person-circle', label: 'Profile' },
];

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/wallet': 'My Wallet',
  '/passbook': 'Passbook',
  '/kyc': 'KYC Verification',
  '/profile': 'My Profile',
};

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  useEffect(() => {
    document.title = 'Dashboard';
  }, []);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : user?.mobile?.slice(-2) || 'U';

  return (
    <div className="app-shell">
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`sidebar${sidebarOpen ? ' open' : ''}`}>
        <div className="sidebar-logo">
          <i className="bi bi-wallet2" />Conceps Wallet
        </div>

        <nav className="sidebar-nav">
          {NAV.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <i className={`bi ${icon} icon`} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button
            className="nav-item btn-full"
            style={{ border: 'none', background: 'none', width: '100%' }}
            onClick={handleLogout}
          >
            <i className="bi bi-box-arrow-right icon" /> Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="main-area">
        {/* Topbar */}
        <header className="topbar">
          <div className="flex gap-12" style={{ alignItems: 'center' }}>
            <button className="hamburger" onClick={() => setSidebarOpen(o => !o)}>
              <i className="bi bi-list" />
            </button>
            <span className="topbar-title">{PAGE_TITLES[pathname] || 'Wallet - App'}</span>
          </div>
          <div className="topbar-right">
            <div className="avatar">{initials}</div>
            <div style={{ lineHeight: 1.3 }}>
              <div style={{ fontSize: '.88rem', fontWeight: 700 }}>{user?.name || 'User'}</div>
              <div style={{ fontSize: '.76rem', color: 'var(--text-muted)' }}>{user?.mobile}</div>
            </div>
          </div>
        </header>

        {/* Page */}
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}