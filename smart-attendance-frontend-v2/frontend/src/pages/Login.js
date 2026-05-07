import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import srmLogo from '../srm-logo.png';

export default function Login() {
  const [form, setForm] = useState({ faculty_id: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(form.faculty_id, form.password);
      navigate(data.faculty.is_admin ? '/admin' : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
      padding: '1rem'
    }}>
      {/* Background glow */}
      <div style={{
        position: 'fixed', top: '20%', left: '50%', transform: 'translateX(-50%)',
        width: 600, height: 600, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      <div style={{ width: '100%', maxWidth: 420, position: 'relative' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <img
            src={srmLogo}
            alt="SRM Logo"
            style={{ width: 140, height: 'auto', margin: '0 auto 1rem', display: 'block', filter: 'drop-shadow(0 0 20px rgba(59,130,246,0.3))' }}
          />
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.25rem' }}>
            SRM Attendance
          </h1>
          <p style={{ color: 'var(--text2)', fontSize: '0.9rem' }}>
            Smart Faculty Attendance System
          </p>
        </div>

        {/* Card */}
        <div className="card card-glow" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '0.25rem' }}>Welcome back</h2>
          <p style={{ color: 'var(--text2)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            Sign in to mark your attendance
          </p>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Faculty ID</label>
              <input
                className="form-input"
                type="text"
                placeholder="e.g. FAC001"
                value={form.faculty_id}
                onChange={e => setForm({ ...form, faculty_id: e.target.value })}
                required
                autoFocus
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                className="form-input"
                type="password"
                placeholder="Enter your password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary btn-full btn-lg"
              disabled={loading}
              style={{ marginTop: '0.5rem' }}
            >
              {loading ? <><span className="spinner"></span> Signing in...</> : '→ Sign In'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text2)', fontSize: '0.88rem' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: 'var(--accent2)', fontWeight: 600 }}>
              Register here
            </Link>
          </p>
        </div>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text3)', fontSize: '0.78rem' }}>
          SRM Institute of Science and Technology · Ramapuram
        </p>
      </div>
    </div>
  );
}
