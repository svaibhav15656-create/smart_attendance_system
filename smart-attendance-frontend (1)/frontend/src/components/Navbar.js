import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { faculty, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <span className="dot"></span>
        SRM Attendance
      </div>

      <div className="navbar-nav">
        {faculty?.is_admin ? (
          <>
            <button className={`nav-link ${isActive('/admin')}`} onClick={() => navigate('/admin')}>Dashboard</button>
            <button className={`nav-link ${isActive('/admin/report')}`} onClick={() => navigate('/admin/report')}>Reports</button>
          </>
        ) : (
          <>
            <button className={`nav-link ${isActive('/dashboard')}`} onClick={() => navigate('/dashboard')}>Home</button>
            <button className={`nav-link ${isActive('/mark-attendance')}`} onClick={() => navigate('/mark-attendance')}>Mark Attendance</button>
            <button className={`nav-link ${isActive('/my-history')}`} onClick={() => navigate('/my-history')}>History</button>
            <button className={`nav-link ${isActive('/face-setup')}`} onClick={() => navigate('/face-setup')}>Face Setup</button>
          </>
        )}
        <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 0.5rem' }} />
        <span style={{ fontSize: '0.85rem', color: 'var(--text2)', marginRight: '0.5rem' }}>
          {faculty?.name?.split(' ')[0]}
        </span>
        <button className="btn btn-ghost" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }} onClick={handleLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
}
