import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../utils/api';

const DEPARTMENTS = [
  'Computer Science', 'Information Technology', 'Electronics & Communication',
  'Electrical Engineering', 'Mechanical Engineering', 'Civil Engineering',
  'Mathematics', 'Physics', 'Chemistry', 'Management Studies'
];

export default function Register() {
  const [form, setForm] = useState({
    faculty_id: '', name: '', email: '', department: '', password: '',
    confirm_password: '', admin_key: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAdminKey, setShowAdminKey] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm_password) {
      return setError('Passwords do not match');
    }
    if (form.password.length < 6) {
      return setError('Password must be at least 6 characters');
    }
    setLoading(true);
    try {
      await API.post('/auth/register', {
        faculty_id: form.faculty_id,
        name: form.name,
        email: form.email,
        department: form.department,
        password: form.password,
        admin_key: form.admin_key
      });
      setSuccess('Registration successful! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'var(--bg)', padding: '1rem'
    }}>
      <div style={{
        position: 'fixed', top: '10%', right: '10%',
        width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(16,185,129,0.06) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      <div style={{ width: '100%', maxWidth: 480, position: 'relative' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14,
            background: 'linear-gradient(135deg, #065f46, #10b981)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.5rem', margin: '0 auto 1rem',
            boxShadow: '0 0 30px rgba(16,185,129,0.25)'
          }}>👤</div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Create Account</h1>
          <p style={{ color: 'var(--text2)', fontSize: '0.85rem' }}>
            Register as SRM Faculty
          </p>
        </div>

        <div className="card card-glow" style={{ padding: '2rem' }}>
          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
              <div className="form-group">
                <label className="form-label">Faculty ID</label>
                <input className="form-input" placeholder="FAC001" value={form.faculty_id} onChange={set('faculty_id')} required />
              </div>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-input" placeholder="Dr. John Smith" value={form.name} onChange={set('name')} required />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input className="form-input" type="email" placeholder="john@srmist.edu.in" value={form.email} onChange={set('email')} required />
            </div>

            <div className="form-group">
              <label className="form-label">Department</label>
              <select className="form-input" value={form.department} onChange={set('department')} required>
                <option value="">Select department</option>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input className="form-input" type="password" placeholder="Min. 6 chars" value={form.password} onChange={set('password')} required />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <input className="form-input" type="password" placeholder="Re-enter" value={form.confirm_password} onChange={set('confirm_password')} required />
              </div>
            </div>

            {/* Admin key toggle */}
            <div style={{ marginBottom: '1.25rem' }}>
              <button
                type="button"
                onClick={() => setShowAdminKey(!showAdminKey)}
                style={{
                  background: 'none', border: 'none', color: 'var(--text3)',
                  fontSize: '0.8rem', cursor: 'pointer', padding: 0, fontFamily: 'Outfit, sans-serif'
                }}
              >
                {showAdminKey ? '▼' : '▶'} Admin registration? (optional)
              </button>
              {showAdminKey && (
                <div style={{ marginTop: '0.5rem' }}>
                  <input
                    className="form-input"
                    type="password"
                    placeholder="Admin secret key"
                    value={form.admin_key}
                    onChange={set('admin_key')}
                  />
                </div>
              )}
            </div>

            <button type="submit" className="btn btn-success btn-full btn-lg" disabled={loading}>
              {loading ? <><span className="spinner"></span> Registering...</> : '✓ Create Account'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text2)', fontSize: '0.88rem' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--accent2)', fontWeight: 600 }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
