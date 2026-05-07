import React, { useState, useEffect } from 'react';
import API from '../utils/api';

export default function AdminReport() {
  const today = new Date().toISOString().split('T')[0];
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [department, setDepartment] = useState('');
  const [departments, setDepartments] = useState([]);
  const [report, setReport] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    API.get('/admin/departments').then(res => setDepartments(res.data.departments)).catch(console.error);
  }, []);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ from, to });
      if (department) params.append('department', department);
      const res = await API.get(`/admin/report?${params}`);
      setReport(res.data.report);
      setFetched(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    const headers = ['Faculty ID', 'Name', 'Department', 'Date', 'Entry', 'Exit', 'Status', 'Face Verified'];
    const rows = report.map(r => [
      r.faculty_id, r.name, r.department,
      r.date ? new Date(r.date).toLocaleDateString('en-IN') : 'Absent',
      r.entry_time ? new Date(r.entry_time).toLocaleTimeString('en-IN') : '—',
      r.exit_time ? new Date(r.exit_time).toLocaleTimeString('en-IN') : '—',
      !r.entry_time ? 'Absent' : r.status,
      r.entry_face_verified ? 'Yes' : 'No'
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_${from}_to_${to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatTime = (ts) => ts ? new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—';
  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }) : '—';

  const summaryStats = {
    present: report.filter(r => r.entry_time && r.status !== 'late').length,
    late: report.filter(r => r.status === 'late').length,
    absent: report.filter(r => !r.entry_time).length,
  };

  return (
    <div className="main-content">
      <div className="page-header">
        <h1>Attendance Reports</h1>
        <p>Filter, view and export attendance data</p>
      </div>

      {/* Filters */}
      <div className="card card-glow" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '1.25rem', fontSize: '0.9rem', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Filter Options
        </h3>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">From Date</label>
            <input className="form-input" type="date" value={from} onChange={e => setFrom(e.target.value)} style={{ width: 160 }} />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">To Date</label>
            <input className="form-input" type="date" value={to} onChange={e => setTo(e.target.value)} style={{ width: 160 }} />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Department</label>
            <select className="form-input" style={{ width: 220 }} value={department} onChange={e => setDepartment(e.target.value)}>
              <option value="">All Departments</option>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <button className="btn btn-primary btn-lg" onClick={fetchReport} disabled={loading}>
            {loading ? <><span className="spinner"></span> Loading...</> : '🔍 Generate Report'}
          </button>
          {fetched && report.length > 0 && (
            <button className="btn btn-ghost btn-lg" onClick={exportCSV}>
              ⬇️ Export CSV
            </button>
          )}
        </div>
      </div>

      {/* Summary */}
      {fetched && (
        <>
          <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
            <div className="stat-card blue">
              <div className="stat-number">{report.length}</div>
              <div className="stat-label">Total Records</div>
            </div>
            <div className="stat-card green">
              <div className="stat-number">{summaryStats.present}</div>
              <div className="stat-label">On Time</div>
            </div>
            <div className="stat-card amber">
              <div className="stat-number">{summaryStats.late}</div>
              <div className="stat-label">Late</div>
            </div>
            <div className="stat-card red">
              <div className="stat-number">{summaryStats.absent}</div>
              <div className="stat-label">Absent</div>
            </div>
          </div>

          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1rem' }}>
                Report: {new Date(from).toLocaleDateString('en-IN')} – {new Date(to).toLocaleDateString('en-IN')}
              </h3>
              <span style={{ color: 'var(--text3)', fontSize: '0.85rem' }}>{report.length} records</span>
            </div>

            {report.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text3)' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📭</div>
                No records found for this filter
              </div>
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Faculty ID</th>
                      <th>Name</th>
                      <th>Department</th>
                      <th>Date</th>
                      <th>Entry</th>
                      <th>Exit</th>
                      <th>Status</th>
                      <th>Face</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.map((r, i) => (
                      <tr key={i}>
                        <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.82rem' }}>{r.faculty_id}</td>
                        <td className="bold">{r.name}</td>
                        <td style={{ fontSize: '0.82rem', color: 'var(--text3)' }}>{r.department}</td>
                        <td>{formatDate(r.date)}</td>
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
            )}
          </div>
        </>
      )}

      {!fetched && (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text3)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
          <p>Select filters above and click <strong style={{ color: 'var(--text2)' }}>Generate Report</strong></p>
        </div>
      )}
    </div>
  );
}
