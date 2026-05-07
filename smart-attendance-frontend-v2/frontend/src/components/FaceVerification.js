import React, { useRef, useState, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import API from '../utils/api';

// Pixel-based similarity check (no heavy ML library needed)
function compareImages(img1DataUrl, img2DataUrl) {
  return new Promise((resolve) => {
    const canvas1 = document.createElement('canvas');
    const canvas2 = document.createElement('canvas');
    const ctx1 = canvas1.getContext('2d');
    const ctx2 = canvas2.getContext('2d');

    const size = 64; // Compare at 64x64
    canvas1.width = canvas2.width = size;
    canvas1.height = canvas2.height = size;

    const img1 = new Image();
    const img2 = new Image();

    img1.onload = () => {
      ctx1.drawImage(img1, 0, 0, size, size);
      img2.onload = () => {
        ctx2.drawImage(img2, 0, 0, size, size);
        const d1 = ctx1.getImageData(0, 0, size, size).data;
        const d2 = ctx2.getImageData(0, 0, size, size).data;

        let diff = 0;
        for (let i = 0; i < d1.length; i += 4) {
          diff += Math.abs(d1[i] - d2[i]);
          diff += Math.abs(d1[i + 1] - d2[i + 1]);
          diff += Math.abs(d1[i + 2] - d2[i + 2]);
        }
        const maxDiff = 255 * 3 * (size * size);
        const similarity = 1 - diff / maxDiff;
        resolve(similarity);
      };
      img2.src = img2DataUrl;
    };
    img1.src = img1DataUrl;
  });
}

export default function FaceVerification({ onVerified, onSkip, mode = 'verify' }) {
  const webcamRef = useRef(null);
  const [step, setStep] = useState('init'); // init | capturing | verifying | done | failed
  const [livenessStep, setLivenessStep] = useState(0); // 0=blink, 1=turn, 2=nod
  const [livenessMsg, setLivenessMsg] = useState('');
  const [error, setError] = useState('');
  const [capturedImage, setCapturedImage] = useState(null);
  const [similarity, setSimilarity] = useState(null);
  const [livenessChecks, setLivenessChecks] = useState([false, false, false]);
  const livenessTimer = useRef(null);

  const LIVENESS_INSTRUCTIONS = [
    { msg: '👁️ Please blink twice', duration: 3000 },
    { msg: '↩️ Turn your head slightly left, then right', duration: 4000 },
    { msg: '🎭 Smile for the camera', duration: 3000 },
  ];

  const startLiveness = useCallback(() => {
    setStep('liveness');
    runLivenessStep(0);
  }, []);

  const runLivenessStep = (stepIndex) => {
    if (stepIndex >= LIVENESS_INSTRUCTIONS.length) {
      setLivenessChecks([true, true, true]);
      setTimeout(() => captureAndVerify(), 500);
      return;
    }
    setLivenessStep(stepIndex);
    setLivenessMsg(LIVENESS_INSTRUCTIONS[stepIndex].msg);

    livenessTimer.current = setTimeout(() => {
      setLivenessChecks(prev => {
        const next = [...prev];
        next[stepIndex] = true;
        return next;
      });
      runLivenessStep(stepIndex + 1);
    }, LIVENESS_INSTRUCTIONS[stepIndex].duration);
  };

  useEffect(() => () => clearTimeout(livenessTimer.current), []);

  const captureAndVerify = useCallback(async () => {
    setStep('verifying');
    const imageSrc = webcamRef.current?.getScreenshot();
    if (!imageSrc) {
      setError('Could not capture image. Ensure camera is accessible.');
      setStep('failed');
      return;
    }
    setCapturedImage(imageSrc);

    if (mode === 'register') {
      onVerified(imageSrc);
      setStep('done');
      return;
    }

    // Verify against stored face
    try {
      const res = await API.get('/auth/face-data');
      const storedFace = res.data.face_data;
      const sim = await compareImages(imageSrc, storedFace);
      setSimilarity(sim);

      // Threshold: 0.82+ is a match (pixel similarity at 64x64)
      if (sim >= 0.82) {
        setStep('done');
        setTimeout(() => onVerified(imageSrc), 800);
      } else {
        setStep('failed');
        setError(`Face match failed (similarity: ${(sim * 100).toFixed(1)}%). Please try again in good lighting.`);
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setError('No face registered. Please go to Face Setup first.');
      } else {
        setError('Verification error. Please try again.');
      }
      setStep('failed');
    }
  }, [mode, onVerified]);

  const reset = () => {
    setStep('init');
    setError('');
    setCapturedImage(null);
    setSimilarity(null);
    setLivenessChecks([false, false, false]);
    setLivenessStep(0);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Step indicator */}
      <div className="step-indicator">
        <div className={`step ${step !== 'init' ? 'done' : 'active'}`}></div>
        <div className={`step ${['verifying', 'done'].includes(step) ? 'done' : step === 'liveness' ? 'active' : ''}`}></div>
        <div className={`step ${step === 'done' ? 'done' : step === 'verifying' ? 'active' : ''}`}></div>
      </div>

      {/* Camera */}
      <div className="webcam-container">
        <Webcam
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          screenshotQuality={0.8}
          width="100%"
          mirrored={true}
          videoConstraints={{ facingMode: 'user', width: 480, height: 360 }}
          style={{ display: 'block' }}
        />
        <div className="webcam-overlay">
          <div className="face-guide" style={{
            borderColor: step === 'done' ? 'var(--green)' : step === 'failed' ? 'var(--red)' : 'var(--accent)'
          }}></div>
        </div>
        <div className="webcam-status">
          {step === 'init' && 'Position your face in the circle'}
          {step === 'liveness' && livenessMsg}
          {step === 'verifying' && '🔍 Analyzing...'}
          {step === 'done' && '✅ Verified!'}
          {step === 'failed' && '❌ Verification failed'}
        </div>
      </div>

      {/* Liveness checks */}
      {step === 'liveness' && (
        <ul className="check-list">
          {LIVENESS_INSTRUCTIONS.map((inst, i) => (
            <li key={i} className={`check-item ${livenessChecks[i] ? 'done' : i === livenessStep ? 'loading' : 'pending'}`}>
              <span className="check-icon">
                {livenessChecks[i] ? '✓' : i === livenessStep ? <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }}></span> : '○'}
              </span>
              {inst.msg}
            </li>
          ))}
        </ul>
      )}

      {error && <div className="alert alert-error">{error}</div>}

      {similarity !== null && step !== 'done' && (
        <div className="alert alert-warning">
          Similarity score: {(similarity * 100).toFixed(1)}% (need ≥82%)
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        {step === 'init' && (
          <button className="btn btn-primary btn-full btn-lg" onClick={startLiveness}>
            🎥 Start Verification
          </button>
        )}
        {(step === 'done') && (
          <div className="alert alert-success" style={{ width: '100%', textAlign: 'center', fontSize: '1rem' }}>
            ✅ Face verification successful!
          </div>
        )}
        {step === 'failed' && (
          <>
            <button className="btn btn-primary btn-lg" style={{ flex: 1 }} onClick={reset}>
              🔄 Try Again
            </button>
            {onSkip && (
              <button className="btn btn-ghost btn-lg" onClick={onSkip}>
                Skip
              </button>
            )}
          </>
        )}
        {step === 'verifying' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', color: 'var(--text2)' }}>
            <div className="spinner"></div> Verifying your face...
          </div>
        )}
      </div>
    </div>
  );
}
