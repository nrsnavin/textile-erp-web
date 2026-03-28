'use client';
// frontend/app/auth/login/page.tsx

import { useState, useRef, useEffect } from 'react';
import { useRouter }   from 'next/navigation';
import { authClient, tokenStore } from '../../../lib/auth/auth-client';

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep]               = useState<'credentials' | 'otp'>('credentials');
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [otp, setOtp]                 = useState(['', '', '', '', '', '']);
  const [tempToken, setTempToken]     = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [success, setSuccess]         = useState('');
  const [showPass, setShowPass]       = useState(false);
  const [countdown, setCountdown]     = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  // ── Step 1: Email + Password ──────────────────────────────────────────
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const result = await authClient.login(email, password);
      if (result.requiresMfa && result.tempToken) {
        setTempToken(result.tempToken);
        setMaskedEmail(email.replace(/(.{1}).+(@.+)/, '$1***$2'));
        setStep('otp');
        setCountdown(60);
        setTimeout(() => otpRefs.current[0]?.focus(), 100);
      } else if (result.accessToken) {
        tokenStore.setTokens(result);
        router.push('/admin/dashboard');
      }
    } catch (err: any) {
      setError(err.message ?? 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // ── Step 2: OTP Verification ──────────────────────────────────────────
  function handleOtpChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    setError('');
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
    if (next.every(d => d !== '')) verifyOtp(next.join(''));
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }

  function handleOtpPaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      verifyOtp(pasted);
    }
  }

  async function verifyOtp(code: string) {
    setError(''); setLoading(true);
    try {
      const result = await authClient.verifyOtp(tempToken, code);
      if (result.accessToken) {
        tokenStore.setTokens(result);
        setSuccess('Verified! Redirecting...');
        setTimeout(() => router.push('/admin/dashboard'), 800);
      }
    } catch (err: any) {
      setError(err.message ?? 'Invalid code. Please try again.');
      setOtp(['', '', '', '', '', '']);
      setTimeout(() => otpRefs.current[0]?.focus(), 50);
    } finally {
      setLoading(false);
    }
  }

  async function handleResendOtp() {
    if (countdown > 0) return;
    setError(''); setLoading(true);
    try {
      const res = await authClient.resendOtp(tempToken);
      setSuccess(res.message);
      setCountdown(60);
      setOtp(['', '', '', '', '', '']);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          font-family: 'DM Sans', sans-serif;
          background: #0a0f1a;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .page {
          min-height: 100vh;
          width: 100%;
          display: grid;
          grid-template-columns: 1fr 480px;
          background: #0a0f1a;
        }

        /* Left panel */
        .left {
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 80px;
          position: relative;
          overflow: hidden;
        }

        .left::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse at 20% 50%, rgba(30,80,160,0.15) 0%, transparent 60%),
            radial-gradient(ellipse at 80% 20%, rgba(20,60,120,0.10) 0%, transparent 50%);
        }

        .grid-bg {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 48px 48px;
        }

        .left-content { position: relative; z-index: 1; }

        .brand {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 64px;
        }

        .brand-icon {
          width: 40px; height: 40px;
          background: linear-gradient(135deg, #1e50a0, #2d78d4);
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
        }

        .brand-icon svg { width: 22px; height: 22px; color: white; }

        .brand-name {
          font-size: 18px;
          font-weight: 600;
          color: #fff;
          letter-spacing: -0.3px;
        }

        .hero-title {
          font-size: clamp(36px, 4vw, 56px);
          font-weight: 600;
          color: #fff;
          line-height: 1.1;
          letter-spacing: -1.5px;
          margin-bottom: 24px;
        }

        .hero-title span {
          background: linear-gradient(135deg, #4d9fff, #2d78d4);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .hero-sub {
          font-size: 17px;
          color: rgba(255,255,255,0.45);
          line-height: 1.7;
          max-width: 420px;
          margin-bottom: 64px;
        }

        .stats {
          display: flex;
          gap: 40px;
        }

        .stat-item { }
        .stat-num {
          font-family: 'DM Mono', monospace;
          font-size: 28px;
          font-weight: 500;
          color: #fff;
          letter-spacing: -0.5px;
        }
        .stat-label {
          font-size: 13px;
          color: rgba(255,255,255,0.35);
          margin-top: 4px;
        }

        /* Right panel — form */
        .right {
          background: #111827;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 56px 48px;
          border-left: 1px solid rgba(255,255,255,0.06);
        }

        .form-header { margin-bottom: 40px; }

        .form-title {
          font-size: 26px;
          font-weight: 600;
          color: #fff;
          letter-spacing: -0.5px;
          margin-bottom: 8px;
        }

        .form-sub {
          font-size: 14px;
          color: rgba(255,255,255,0.40);
        }

        .form-sub strong { color: rgba(255,255,255,0.65); }

        /* Form elements */
        .field { margin-bottom: 20px; }

        label {
          display: block;
          font-size: 13px;
          font-weight: 500;
          color: rgba(255,255,255,0.55);
          margin-bottom: 8px;
          letter-spacing: 0.3px;
          text-transform: uppercase;
          font-size: 11px;
        }

        .input-wrap { position: relative; }

        input[type="email"],
        input[type="password"],
        input[type="text"] {
          width: 100%;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.10);
          border-radius: 10px;
          padding: 14px 16px;
          font-size: 15px;
          color: #fff;
          font-family: 'DM Sans', sans-serif;
          outline: none;
          transition: border-color 0.2s, background 0.2s;
        }

        input:focus {
          border-color: rgba(45,120,212,0.6);
          background: rgba(45,120,212,0.08);
        }

        input::placeholder { color: rgba(255,255,255,0.25); }

        .pass-toggle {
          position: absolute;
          right: 14px; top: 50%;
          transform: translateY(-50%);
          background: none; border: none; cursor: pointer;
          color: rgba(255,255,255,0.35);
          padding: 4px;
          display: flex;
          transition: color 0.2s;
        }
        .pass-toggle:hover { color: rgba(255,255,255,0.7); }
        .pass-toggle svg { width: 18px; height: 18px; }

        .forgot-link {
          text-align: right;
          margin-top: -12px;
          margin-bottom: 16px;
        }
        .forgot-link a {
          font-size: 13px;
          color: #4d9fff;
          text-decoration: none;
          transition: opacity 0.2s;
        }
        .forgot-link a:hover { opacity: 0.75; }

        .btn-primary {
          width: 100%;
          background: linear-gradient(135deg, #1e50a0, #2d78d4);
          color: #fff;
          border: none;
          border-radius: 10px;
          padding: 15px;
          font-size: 15px;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.1s;
          letter-spacing: -0.2px;
          margin-top: 8px;
        }
        .btn-primary:hover:not(:disabled) { opacity: 0.88; }
        .btn-primary:active:not(:disabled) { transform: scale(0.99); }
        .btn-primary:disabled { opacity: 0.45; cursor: not-allowed; }

        /* Error + success */
        .alert {
          border-radius: 10px;
          padding: 12px 16px;
          font-size: 14px;
          margin-bottom: 20px;
          display: flex;
          align-items: flex-start;
          gap: 10px;
        }
        .alert-error {
          background: rgba(220,38,38,0.12);
          border: 1px solid rgba(220,38,38,0.25);
          color: #fca5a5;
        }
        .alert-success {
          background: rgba(34,197,94,0.10);
          border: 1px solid rgba(34,197,94,0.25);
          color: #86efac;
        }
        .alert svg { width: 16px; height: 16px; flex-shrink: 0; margin-top: 1px; }

        /* OTP inputs */
        .otp-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 10px;
          margin-bottom: 24px;
        }

        .otp-input {
          width: 100% !important;
          aspect-ratio: 1;
          text-align: center !important;
          font-family: 'DM Mono', monospace !important;
          font-size: 22px !important;
          font-weight: 500 !important;
          padding: 0 !important;
          border-radius: 12px !important;
        }

        .otp-input:focus {
          border-color: rgba(45,120,212,0.8) !important;
          background: rgba(45,120,212,0.12) !important;
        }

        .otp-input.filled {
          border-color: rgba(45,120,212,0.5);
          background: rgba(45,120,212,0.08);
        }

        /* Resend */
        .resend-row {
          text-align: center;
          margin-top: 4px;
        }
        .resend-btn {
          background: none; border: none;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          cursor: pointer;
          transition: color 0.2s;
        }
        .resend-btn:disabled {
          color: rgba(255,255,255,0.30);
          cursor: default;
        }
        .resend-btn:not(:disabled) { color: #4d9fff; }
        .resend-btn:not(:disabled):hover { color: #7db8ff; }

        .back-btn {
          background: none; border: none;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px; color: rgba(255,255,255,0.40);
          cursor: pointer; display: flex; align-items: center; gap: 6px;
          margin-bottom: 32px; padding: 0;
          transition: color 0.2s;
        }
        .back-btn:hover { color: rgba(255,255,255,0.7); }
        .back-btn svg { width: 16px; height: 16px; }

        .loading-dots {
          display: inline-flex; gap: 4px; align-items: center;
        }
        .loading-dots span {
          width: 5px; height: 5px;
          background: rgba(255,255,255,0.7);
          border-radius: 50%;
          animation: dot 1.2s infinite;
        }
        .loading-dots span:nth-child(2) { animation-delay: 0.2s; }
        .loading-dots span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes dot { 0%,80%,100%{opacity:0.2} 40%{opacity:1} }

        @media (max-width: 768px) {
          .page { grid-template-columns: 1fr; }
          .left { display: none; }
          .right { padding: 40px 24px; }
        }
      `}</style>

      <div className="page">
        {/* ── Left panel ─────────────────────────────────────────────── */}
        <div className="left">
          <div className="grid-bg" />
          <div className="left-content">
            <div className="brand">
              <div className="brand-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                  <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
              </div>
              <span className="brand-name">Textile ERP</span>
            </div>

            <h1 className="hero-title">
              Enterprise control<br />for <span>garment makers</span>
            </h1>
            <p className="hero-sub">
              From yarn to dispatch — manage your entire
              manufacturing lifecycle in one platform built
              for Indian SME factories.
            </p>

            <div className="stats">
              <div className="stat-item">
                <div className="stat-num">20+</div>
                <div className="stat-label">Factory tenants</div>
              </div>
              <div className="stat-item">
                <div className="stat-num">8hr</div>
                <div className="stat-label">Offline survival</div>
              </div>
              <div className="stat-item">
                <div className="stat-num">99.9%</div>
                <div className="stat-label">Uptime SLA</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right panel ────────────────────────────────────────────── */}
        <div className="right">
          {step === 'credentials' ? (
            <>
              <div className="form-header">
                <h2 className="form-title">Sign in</h2>
                <p className="form-sub">Welcome back to your factory dashboard</p>
              </div>

              {error && (
                <div className="alert alert-error">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {error}
                </div>
              )}

              <form onSubmit={handleLogin}>
                <div className="field">
                  <label>Email address</label>
                  <input
                    type="email"
                    placeholder="you@factory.com"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError(''); }}
                    required autoFocus autoComplete="email"
                  />
                </div>

                <div className="field">
                  <label>Password</label>
                  <div className="input-wrap">
                    <input
                      type={showPass ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={e => { setPassword(e.target.value); setError(''); }}
                      required autoComplete="current-password"
                      style={{ paddingRight: 48 }}
                    />
                    <button
                      type="button"
                      className="pass-toggle"
                      onClick={() => setShowPass(s => !s)}
                    >
                      {showPass ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                          <line x1="1" y1="1" x2="23" y2="23"/>
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div className="forgot-link">
                  <a href="/auth/forgot-password">Forgot password?</a>
                </div>

                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? (
                    <span className="loading-dots">
                      <span/><span/><span/>
                    </span>
                  ) : 'Continue'}
                </button>
              </form>
            </>
          ) : (
            <>
              <button className="back-btn" onClick={() => {
                setStep('credentials'); setError(''); setOtp(['','','','','','']);
              }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
                Back
              </button>

              <div className="form-header">
                <h2 className="form-title">Check your email</h2>
                <p className="form-sub">
                  We sent a 6-digit code to{' '}
                  <strong>{maskedEmail}</strong>
                </p>
              </div>

              {error && (
                <div className="alert alert-error">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {error}
                </div>
              )}

              {success && (
                <div className="alert alert-success">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  {success}
                </div>
              )}

              <div className="otp-grid" onPaste={handleOtpPaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => { otpRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(i, e)}
                    className={`otp-input${digit ? ' filled' : ''}`}
                    disabled={loading}
                  />
                ))}
              </div>

              <button
                className="btn-primary"
                disabled={loading || otp.some(d => !d)}
                onClick={() => verifyOtp(otp.join(''))}
              >
                {loading ? (
                  <span className="loading-dots"><span/><span/><span/></span>
                ) : 'Verify code'}
              </button>

              <div className="resend-row" style={{ marginTop: 20 }}>
                <button
                  className="resend-btn"
                  onClick={handleResendOtp}
                  disabled={countdown > 0 || loading}
                >
                  {countdown > 0
                    ? `Resend code in ${countdown}s`
                    : "Didn't receive it? Resend"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
