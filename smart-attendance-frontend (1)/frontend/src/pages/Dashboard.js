import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';

function TimeDisplay() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: '2.8rem', fontWeight: 500,
      color: 'var(--text)', letterSpacing: '0.05em'
    }}>
      {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      <div style={{ fontSize: '0.9rem', color: 'var(--text2)', fontFamily: 'Outfit, sans-serif', fontWeight: 400, marginTop: '0.25rem' }}>
        {time.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { faculty } = useAuth();
  const navigate = useNavigate();
  const [todayRecord, setTodayRecord] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      API.get('/attendance/today'),
      API.get('/attendance/my-history')
    ]).then(([todayRes, histRes]) => {
      setTodayRecord(todayRes.data.attendance);
      setHistory(histRes.data.attendance.slice(0, 7));
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const formatTime = (ts) => {
    if (!ts) return '—';
    return new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusBadge = (record) => {
    if (!record || !record.entry_time) return <span className="badge badge-absent">Absent</span>;
    if (record.status === 'late') return <span className="badge badge-late">Late</span>;
    return <span className="badge badge-present">Present</span>;
  };

  const entryDone = !!todayRecord?.entry_time;
  const exitDone = !!todayRecord?.exit_time;

  return (
    <div className="main-content">
      {/* Welcome header */}
      <div style={{
        background: 'linear-gradient(135deg, var(--surface) 0%, var(--bg3) 100%)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '2rem',
        marginBottom: '1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <p style={{ color: 'var(--text2)', fontSize: '0.85rem', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}
          </p>
          <h1 style={{ fontSize: '1.6rem', marginBottom: '0.25rem' }}>{faculty?.name}</h1>
          <p style={{ color: 'var(--text2)', fontSize: '0.9rem' }}>
            {faculty?.department} · {faculty?.faculty_id}
          </p>
          {!faculty?.has_face_data && (
            <div className="alert alert-warning" style={{ marginTop: '1rem', marginBottom: 0 }}>
              ⚠️ Face not registered.{' '}
              <span
                style={{ cursor: 'pointer', textDecoration: 'underline' }}
                onClick={() => navigate('/face-setup')}
              >
                Set up now →
              </span>
            </div>
          )}
        </div>
        <TimeDisplay />
      </div>

      {/* Today's status */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="stat-card green">
          <div style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>🟢</div>
          <div className="stat-label" style={{ marginBottom: '0.25rem' }}>Entry Time</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: entryDone ? 'var(--green)' : 'var(--text3)' }}>
            {loading ? '...' : entryDone ? formatTime(todayRecord.entry_time) : 'Not Marked'}
          </div>
          {todayRecord?.entry_face_verified && (
            <div style={{ fontSize: '0.75rem', color: 'var(--green)', marginTop: '0.25rem' }}>✓ Face verified</div>
          )}
        </div>

        <div className="stat-card blue">
          <div style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>🔵</div>
          <div className="stat-label" style={{ marginBottom: '0.25rem' }}>Exit Time</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: exitDone ? 'var(--accent2)' : 'var(--text3)' }}>
            {loading ? '...' : exitDone ? formatTime(todayRecord.exit_time) : 'Not Marked'}
          </div>
          {todayRecord?.exit_face_verified && (
            <div style={{ fontSize: '0.75rem', color: 'var(--accent2)', marginTop: '0.25rem' }}>✓ Face verified</div>
          )}
        </div>

        <div className={`stat-card ${!todayRecord?.entry_time ? 'red' : todayRecord.status === 'late' ? 'amber' : 'green'}`}>
          <div style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>📋</div>
          <div className="stat-label" style={{ marginBottom: '0.25rem' }}>Today's Status</div>
          <div style={{ marginTop: '0.5rem' }}>
            {loading ? '...' : getStatusBadge(todayRecord)}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem', fontSize: '1rem', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.8rem' }}>
          Quick Actions
        </h3>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button
            className="btn btn-success btn-lg"
            onClick={() => navigate('/mark-attendance')}
            disabled={entryDone && exitDone}
          >
            {!entryDone ? '⬆️ Mark Entry' : !exitDone ? '⬇️ Mark Exit' : '✅ All Done Today'}
          </button>
          <button className="btn btn-ghost" onClick={() => navigate('/my-history')}>
            📅 View History
          </button>
          <button className="btn btn-ghost" onClick={() => navigate('/face-setup')}>
            🔍 {faculty?.has_face_data ? 'Update Face' : 'Setup Face'}
          </button>
        </div>
      </div>

      {/* Recent history */}
      <div className="card">
        <h3 style={{ marginBottom: '1.25rem', fontSize: '1rem' }}>Recent Attendance</h3>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text3)' }}>
            <div className="spinner" style={{ margin: '0 auto' }}></div>
          </div>
        ) : history.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text3)' }}>
            No attendance records yet
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Entry</th>
                  <th>Exit</th>
                  <th>Status</th>
                  <th>Face</th>
                </tr>
              </thead>
              <tbody>
                {history.map((r, i) => (
                  <tr key={i}>
                    <td className="bold">{new Date(r.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', weekday: 'short' })}</td>
                    <td>{formatTime(r.entry_time)}</td>
                    <td>{formatTime(r.exit_time)}</td>
                    <td>{getStatusBadge(r)}</td>
                    <td>{r.entry_face_verified ? '✅' : '❌'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
