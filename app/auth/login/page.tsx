'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authClient, tokenStore } from '@/lib/auth/auth-client';
import { useAuthStore } from '@/lib/stores/auth.store';

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
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

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

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
        setAuth(result);
        router.push('/admin/dashboard');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

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
        setAuth(result);
        setSuccess('Verified! Redirecting...');
        setTimeout(() => router.push('/admin/dashboard'), 800);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid code. Please try again.');
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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to resend.');
    } finally {
      setLoading(false);
    }
  }

  return (
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
                <label className="auth-label">Email address</label>
                <input
                  className="auth-input"
                  type="email"
                  placeholder="you@factory.com"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(''); }}
                  required autoFocus autoComplete="email"
                />
              </div>

              <div className="field">
                <label className="auth-label">Password</label>
                <div className="input-wrap">
                  <input
                    className="auth-input"
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
                    <span /><span /><span />
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
                <span className="loading-dots"><span /><span /><span /></span>
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
  );
}
