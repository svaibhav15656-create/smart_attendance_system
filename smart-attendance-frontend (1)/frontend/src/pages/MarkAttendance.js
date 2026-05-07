import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';
import FaceVerification from '../components/FaceVerification';

const STEPS = ['Check Status', 'Face Verification', 'Confirm'];

export default function MarkAttendance() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [type, setType] = useState(null); // 'entry' | 'exit'
  const [todayRecord, setTodayRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [faceVerified, setFaceVerified] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    API.get('/attendance/today')
      .then(res => setTodayRecord(res.data.attendance))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const entryDone = !!todayRecord?.entry_time;
  const exitDone = !!todayRecord?.exit_time;

  const handleTypeSelect = (t) => {
    setType(t);
    setStep(1);
  };

  const handleFaceVerified = (image) => {
    setCapturedImage(image);
    setFaceVerified(true);
    setStep(2);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const endpoint = type === 'entry' ? '/attendance/entry' : '/attendance/exit';
      const res = await API.post(endpoint, { face_verified: faceVerified });
      setResult(res.data);
      setStep(3);
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Failed to mark attendance';
      setError(msg);
      if (err.response?.status === 403) {
        setError('❌ Not on college WiFi. Please connect to the campus network.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (ts) => new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  if (loading) {
    return (
      <div className="main-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <div className="spinner"></div>
      </div>
    );
  }

  // All done
  if (entryDone && exitDone && step < 3) {
    return (
      <div className="main-content">
        <div className="card card-glow" style={{ maxWidth: 500, margin: '2rem auto', textAlign: 'center', padding: '3rem 2rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
          <h2 style={{ marginBottom: '0.5rem' }}>All Done for Today!</h2>
          <p style={{ color: 'var(--text2)', marginBottom: '2rem' }}>
            Entry: {formatTime(todayRecord.entry_time)} · Exit: {formatTime(todayRecord.exit_time)}
          </p>
          <button className="btn btn-ghost" onClick={() => navigate('/dashboard')}>← Back to Dashboard</button>
        </div>
      </div>
    );
  }

  // Success result
  if (step === 3 && result) {
    return (
      <div className="main-content">
        <div className="card card-glow" style={{ maxWidth: 500, margin: '2rem auto', textAlign: 'center', padding: '3rem 2rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>{type === 'entry' ? '✅' : '👋'}</div>
          <h2 style={{ marginBottom: '0.5rem', color: 'var(--green)' }}>
            {type === 'entry' ? 'Entry Marked!' : 'Exit Marked!'}
          </h2>
          <p style={{ color: 'var(--text2)', marginBottom: '0.5rem' }}>
            Time: <strong style={{ color: 'var(--text)' }}>
              {formatTime(type === 'entry' ? result.attendance?.entry_time : result.attendance?.exit_time)}
            </strong>
          </p>
          {result.status === 'late' && (
            <div className="alert alert-warning" style={{ marginTop: '1rem' }}>
              ⚠️ Marked as Late
            </div>
          )}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: '2rem' }}>
            <button className="btn btn-ghost" onClick={() => navigate('/dashboard')}>← Dashboard</button>
            <button className="btn btn-ghost" onClick={() => navigate('/my-history')}>📅 History</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content">
      <div className="page-header">
        <h1>Mark Attendance</h1>
        <p style={{ color: 'var(--text2)' }}>Complete all steps to record your attendance</p>
      </div>

      {/* Step header */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', alignItems: 'center' }}>
        {STEPS.map((s, i) => (
          <React.Fragment key={i}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.4rem 0.85rem', borderRadius: 9999,
              background: i < step ? 'var(--green-glow)' : i === step ? 'var(--accent-glow)' : 'var(--surface)',
              border: `1px solid ${i < step ? 'rgba(16,185,129,0.3)' : i === step ? 'rgba(59,130,246,0.3)' : 'var(--border)'}`,
              color: i < step ? 'var(--green)' : i === step ? 'var(--accent2)' : 'var(--text3)',
              fontSize: '0.8rem', fontWeight: 600, whiteSpace: 'nowrap'
            }}>
              {i < step ? '✓' : `${i + 1}`} {s}
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ flex: 1, height: 1, background: i < step ? 'var(--green)' : 'var(--border)' }} />
            )}
          </React.Fragment>
        ))}
      </div>

      <div style={{ maxWidth: 540 }}>

        {/* Step 0: Choose type */}
        {step === 0 && (
          <div className="card card-glow">
            <h3 style={{ marginBottom: '0.5rem' }}>What would you like to mark?</h3>
            <p style={{ color: 'var(--text2)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              {!entryDone ? 'Entry not yet marked today.' : 'Entry done. Mark exit now.'}
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              {!entryDone && (
                <button
                  className="btn btn-success btn-lg"
                  style={{ flex: 1 }}
                  onClick={() => handleTypeSelect('entry')}
                >
                  ⬆️ Mark Entry
                </button>
              )}
              {entryDone && !exitDone && (
                <button
                  className="btn btn-primary btn-lg"
                  style={{ flex: 1 }}
                  onClick={() => handleTypeSelect('exit')}
                >
                  ⬇️ Mark Exit
                </button>
              )}
            </div>
          </div>
        )}

        {/* Step 1: Face Verification */}
        {step === 1 && (
          <div className="card card-glow">
            <h3 style={{ marginBottom: '0.25rem' }}>Face Verification</h3>
            <p style={{ color: 'var(--text2)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Complete liveness check to verify your identity
            </p>
            <FaceVerification
              onVerified={handleFaceVerified}
              onSkip={() => { setFaceVerified(false); setStep(2); }}
              mode="verify"
            />
            <button
              className="btn btn-ghost"
              style={{ marginTop: '1rem', width: '100%' }}
              onClick={() => setStep(0)}
            >
              ← Back
            </button>
          </div>
        )}

        {/* Step 2: Confirm */}
        {step === 2 && (
          <div className="card card-glow">
            <h3 style={{ marginBottom: '1.5rem' }}>Confirm Attendance</h3>

            <ul className="check-list" style={{ marginBottom: '1.5rem' }}>
              <li className="check-item done">
                <span className="check-icon">✓</span>
                Logged in as <strong style={{ color: 'var(--text)', marginLeft: 4 }}>authenticated faculty</strong>
              </li>
              <li className={`check-item ${faceVerified ? 'done' : 'failed'}`}>
                <span className="check-icon">{faceVerified ? '✓' : '!'}</span>
                Face verification {faceVerified ? 'passed' : 'skipped'}
              </li>
              <li className="check-item loading">
                <span className="check-icon"><span className="spinner" style={{ width: 12, height: 12, borderWidth: 2 }}></span></span>
                WiFi restriction will be checked on submit
              </li>
            </ul>

            <div style={{
              background: 'var(--bg3)', borderRadius: 'var(--radius)',
              padding: '1rem', marginBottom: '1.5rem',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text3)', marginBottom: '0.25rem' }}>Marking</div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                  {type === 'entry' ? '⬆️ Entry' : '⬇️ Exit'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text3)', marginBottom: '0.25rem' }}>Time</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>
                  {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>

            {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn btn-ghost" onClick={() => { setStep(1); setFaceVerified(false); setError(''); }} style={{ flex: 1 }}>
                ← Re-verify
              </button>
              <button
                className="btn btn-success btn-lg"
                onClick={handleSubmit}
                disabled={submitting}
                style={{ flex: 2 }}
              >
                {submitting ? <><span className="spinner"></span> Marking...</> : `✓ Confirm ${type === 'entry' ? 'Entry' : 'Exit'}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
