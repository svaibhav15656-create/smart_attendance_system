import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [todayList, setTodayList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    Promise.all([
      API.get('/admin/dashboard'),
      API.get('/admin/today')
    ]).then(([statsRes, todayRes]) => {
      setStats(statsRes.data);
      setTodayList(todayRes.data.attendance);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const formatTime = (ts) => ts
    ? new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    : '—';

  const filtered = todayList.filter(r => {
    if (filter === 'present') return r.entry_time && r.status !== 'late';
    if (filter === 'late') return r.status === 'late';
    if (filter === 'absent') return !r.entry_time;
    return true;
  });

  return (
    <div className="main-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div className="page-header" style={{ margin: 0 }}>
          <h1>Admin Dashboard</h1>
          <p>Today: {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <button className="btn btn-ghost" onClick={() => navigate('/admin/report')}>
          📊 Full Reports →
        </button>
      </div>

      {/* Stats */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}><div className="spinner" style={{ margin: '0 auto' }}></div></div>
      ) : (
        <>
          <div className="stats-grid">
            <div className="stat-card blue">
              <div className="stat-number">{stats?.total_faculty ?? '—'}</div>
              <div className="stat-label">Total Faculty</div>
            </div>
            <div className="stat-card green">
              <div className="stat-number">{stats?.today_present ?? '—'}</div>
              <div className="stat-label">Present Today</div>
            </div>
            <div className="stat-card amber">
              <div className="stat-number">{stats?.today_late ?? '—'}</div>
              <div className="stat-label">Late Today</div>
            </div>
            <div className="stat-card red">
              <div className="stat-number">{stats?.today_absent ?? '—'}</div>
              <div className="stat-label">Absent Today</div>
            </div>
          </div>

          {/* Attendance rate bar */}
          {stats && stats.total_faculty > 0 && (
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ fontWeight: 600 }}>Today's Attendance Rate</span>
                <span style={{ color: 'var(--green)', fontWeight: 700 }}>
                  {Math.round((stats.today_present / stats.total_faculty) * 100)}%
                </span>
              </div>
              <div style={{ background: 'var(--bg3)', borderRadius: 9999, height: 10, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 9999,
                  background: 'linear-gradient(90deg, var(--green), var(--accent))',
                  width: `${Math.round((stats.today_present / stats.total_faculty) * 100)}%`,
                  transition: 'width 1s ease'
                }} />
              </div>
              <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text2)' }}>
                <span>🟢 Present: {stats.today_present}</span>
                <span>🟡 Late: {stats.today_late}</span>
                <span>🔴 Absent: {stats.today_absent}</span>
              </div>
            </div>
          )}

          {/* Today's list */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <h3 style={{ fontSize: '1rem' }}>Today's Attendance</h3>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {['all', 'present', 'late', 'absent'].map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    style={{
                      padding: '0.3rem 0.75rem', borderRadius: 9999,
                      border: `1px solid ${filter === f ? 'var(--accent)' : 'var(--border)'}`,
                      background: filter === f ? 'var(--accent-glow)' : 'transparent',
                      color: filter === f ? 'var(--accent2)' : 'var(--text3)',
                      fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                      fontFamily: 'Outfit, sans-serif', textTransform: 'capitalize'
                    }}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Faculty ID</th>
                    <th>Name</th>
                    <th>Department</th>
                    <th>Entry</th>
                    <th>Exit</th>
                    <th>Status</th>
                    <th>Face</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text3)' }}>No records</td></tr>
                  ) : filtered.map((r, i) => (
                    <tr key={i}>
                      <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.82rem' }}>{r.faculty_id}</td>
                      <td className="bold">{r.name}</td>
                      <td style={{ fontSize: '0.82rem' }}>{r.department}</td>
                      <td>{formatTime(r.entry_time)}</td>
                      <td>{formatTime(r.exit_time)}</td>
                      <td>
                        {!r.entry_time
                          ? <span className="badge badge-absent">Absent</span>
                          : r.status === 'late'
                            ? <span className="badge badge-late">Late</span>
                            : <span className="badge badge-present">Present</span>}
                      </td>
                      <td>{r.entry_face_verified ? '✅' : <span style={{ color: 'var(--text3)' }}>—</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
