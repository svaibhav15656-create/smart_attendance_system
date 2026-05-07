import React, { useState, useEffect } from 'react';
import API from '../utils/api';

export default function MyHistory() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  const fetchHistory = () => {
    setLoading(true);
    API.get(`/attendance/my-history?month=${month}&year=${year}`)
      .then(res => setRecords(res.data.attendance))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchHistory(); }, [month, year]);

  const formatTime = (ts) => ts
    ? new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    : '—';

  const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', {
    weekday: 'short', day: '2-digit', month: 'short'
  });

  const stats = {
    present: records.filter(r => r.status === 'present').length,
    late: records.filter(r => r.status === 'late').length,
    total: records.length
  };

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  return (
    <div className="main-content">
      <div className="page-header">
        <h1>My Attendance History</h1>
        <p>View and track your attendance records</p>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">Month</label>
          <select className="form-input" style={{ width: 140 }} value={month} onChange={e => setMonth(e.target.value)}>
            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
        </div>
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">Year</label>
          <select className="form-input" style={{ width: 110 }} value={year} onChange={e => setYear(e.target.value)}>
            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Summary stats */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card blue">
          <div className="stat-number">{stats.total}</div>
          <div className="stat-label">Total Days Recorded</div>
        </div>
        <div className="stat-card green">
          <div className="stat-number">{stats.present}</div>
          <div className="stat-label">On Time</div>
        </div>
        <div className="stat-card amber">
          <div className="stat-number">{stats.late}</div>
          <div className="stat-label">Late Arrivals</div>
        </div>
        <div className="stat-card red">
          <div className="stat-number">
            {Math.max(0, (stats.present + stats.late) > 0
              ? Math.round(((stats.present) / (stats.present + stats.late)) * 100)
              : 0)}%
          </div>
          <div className="stat-label">On-Time Rate</div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <h3 style={{ marginBottom: '1.25rem', fontSize: '1rem' }}>
          {MONTHS[month - 1]} {year} — Attendance Log
        </h3>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div className="spinner" style={{ margin: '0 auto' }}></div>
          </div>
        ) : records.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text3)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📭</div>
            No records for this month
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Entry</th>
                  <th>Exit</th>
                  <th>Duration</th>
                  <th>Status</th>
                  <th>Face Verified</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r, i) => {
                  const duration = r.entry_time && r.exit_time
                    ? Math.round((new Date(r.exit_time) - new Date(r.entry_time)) / 60000)
                    : null;
                  return (
                    <tr key={i}>
                      <td className="bold">{formatDate(r.date)}</td>
                      <td>{formatTime(r.entry_time)}</td>
                      <td>{formatTime(r.exit_time)}</td>
                      <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.85rem' }}>
                        {duration ? `${Math.floor(duration / 60)}h ${duration % 60}m` : '—'}
                      </td>
                      <td>
                        {!r.entry_time
                          ? <span className="badge badge-absent">Absent</span>
                          : r.status === 'late'
                            ? <span className="badge badge-late">Late</span>
                            : <span className="badge badge-present">Present</span>
                        }
                      </td>
                      <td>
                        {r.entry_face_verified
                          ? <span style={{ color: 'var(--green)' }}>✅ Yes</span>
                          : <span style={{ color: 'var(--text3)' }}>❌ No</span>
                        }
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
