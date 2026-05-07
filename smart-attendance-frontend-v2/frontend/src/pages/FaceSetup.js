import React, { useState, useRef } from 'react';
import Webcam from 'react-webcam';
import API from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function FaceSetup() {
  const { faculty, setFaculty } = useAuth();
  const webcamRef = useRef(null);
  const [step, setStep] = useState('info'); // info | camera | preview | saving | done
  const [captured, setCaptured] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const capture = () => {
    const img = webcamRef.current?.getScreenshot();
    if (img) {
      setCaptured(img);
      setStep('preview');
    }
  };

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      await API.post('/auth/save-face', { face_data: captured });
      setFaculty(prev => ({ ...prev, has_face_data: true }));
      setStep('done');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save face data');
      setSaving(false);
    }
  };

  const retake = () => {
    setCaptured(null);
    setStep('camera');
    setError('');
  };

  return (
    <div className="main-content">
      <div className="page-header">
        <h1>Face Setup</h1>
        <p>Register your face for attendance verification</p>
      </div>

      <div style={{ maxWidth: 520 }}>

        {/* Info step */}
        {step === 'info' && (
          <div className="card card-glow">
            <div style={{ textAlign: 'center', padding: '1rem 0 1.5rem' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔍</div>
              <h2 style={{ marginBottom: '0.5rem' }}>
                {faculty?.has_face_data ? 'Update Your Face' : 'Register Your Face'}
              </h2>
              <p style={{ color: 'var(--text2)', marginBottom: '2rem', lineHeight: 1.7 }}>
                Your face will be used to verify your identity when marking attendance.
                This prevents proxy attendance.
              </p>
            </div>

            <ul className="check-list" style={{ marginBottom: '2rem' }}>
              {[
                '💡 Ensure good, even lighting on your face',
                '👁️ Look directly at the camera',
                '🚫 Remove glasses, hat, or face coverings',
                '📱 Keep face within the circle guide',
                '😐 Keep a neutral expression'
              ].map((tip, i) => (
                <li key={i} className="check-item pending">
                  <span className="check-icon">i</span>
                  {tip}
                </li>
              ))}
            </ul>

            <button className="btn btn-primary btn-full btn-lg" onClick={() => setStep('camera')}>
              📷 Open Camera
            </button>
          </div>
        )}

        {/* Camera step */}
        {step === 'camera' && (
          <div className="card card-glow">
            <h3 style={{ marginBottom: '1rem' }}>Position your face</h3>
            <p style={{ color: 'var(--text2)', fontSize: '0.85rem', marginBottom: '1rem' }}>
              Center your face in the circle, then click capture
            </p>

            <div className="webcam-container" style={{ marginBottom: '1rem' }}>
              <Webcam
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                screenshotQuality={0.9}
                width="100%"
                mirrored={true}
                videoConstraints={{ facingMode: 'user', width: 480, height: 360 }}
                style={{ display: 'block' }}
              />
              <div className="webcam-overlay">
                <div className="face-guide"></div>
              </div>
              <div className="webcam-status">Align your face in the circle</div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn btn-ghost" onClick={() => setStep('info')} style={{ flex: 1 }}>
                ← Back
              </button>
              <button className="btn btn-primary btn-lg" onClick={capture} style={{ flex: 2 }}>
                📸 Capture
              </button>
            </div>
          </div>
        )}

        {/* Preview step */}
        {step === 'preview' && captured && (
          <div className="card card-glow">
            <h3 style={{ marginBottom: '1rem' }}>Review your photo</h3>
            <p style={{ color: 'var(--text2)', fontSize: '0.85rem', marginBottom: '1rem' }}>
              Make sure your face is clear and well-lit
            </p>

            <div style={{
              borderRadius: 'var(--radius-lg)', overflow: 'hidden',
              border: '2px solid var(--border)', marginBottom: '1rem'
            }}>
              <img src={captured} alt="Captured face" style={{ width: '100%', display: 'block' }} />
            </div>

            {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn btn-ghost btn-lg" onClick={retake} style={{ flex: 1 }} disabled={saving}>
                🔄 Retake
              </button>
              <button className="btn btn-success btn-lg" onClick={save} style={{ flex: 2 }} disabled={saving}>
                {saving ? <><span className="spinner"></span> Saving...</> : '✓ Save Face'}
              </button>
            </div>
          </div>
        )}

        {/* Done */}
        {step === 'done' && (
          <div className="card card-glow" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
            <h2 style={{ marginBottom: '0.5rem', color: 'var(--green)' }}>Face Registered!</h2>
            <p style={{ color: 'var(--text2)', marginBottom: '2rem' }}>
              Your face has been saved. You can now use face verification when marking attendance.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button className="btn btn-ghost" onClick={() => setStep('info')}>Update Again</button>
              <button className="btn btn-primary" onClick={() => window.location.href = '/mark-attendance'}>
                Mark Attendance →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
