'use client';
// frontend/app/auth/forgot-password/page.tsx

import { useState } from 'react';
import { authClient } from '../../../lib/auth/auth-client';

export default function ForgotPasswordPage() {
  const [email,   setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);
  const [error,   setError]   = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await authClient.forgotPassword(email);
      setSent(true);
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; background: #0a0f1a; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
        .wrap { width: 420px; padding: 24px; }
        .card { background: #111827; border: 1px solid rgba(255,255,255,0.07); border-radius: 16px; padding: 48px 40px; }
        .icon-wrap { width: 56px; height: 56px; background: rgba(45,120,212,0.15); border-radius: 14px; display: flex; align-items: center; justify-content: center; margin-bottom: 28px; }
        .icon-wrap svg { width: 28px; height: 28px; color: #4d9fff; }
        h1 { font-size: 24px; font-weight: 600; color: #fff; letter-spacing: -0.5px; margin-bottom: 10px; }
        p { font-size: 14px; color: rgba(255,255,255,0.45); line-height: 1.7; margin-bottom: 32px; }
        label { display: block; font-size: 11px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; color: rgba(255,255,255,0.45); margin-bottom: 8px; }
        input { width: 100%; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.10); border-radius: 10px; padding: 14px 16px; font-size: 15px; color: #fff; font-family: 'DM Sans', sans-serif; outline: none; transition: border-color 0.2s; }
        input:focus { border-color: rgba(45,120,212,0.6); background: rgba(45,120,212,0.08); }
        input::placeholder { color: rgba(255,255,255,0.25); }
        .btn { width: 100%; margin-top: 20px; background: linear-gradient(135deg,#1e50a0,#2d78d4); color: #fff; border: none; border-radius: 10px; padding: 15px; font-size: 15px; font-weight: 600; font-family: 'DM Sans', sans-serif; cursor: pointer; transition: opacity 0.2s; }
        .btn:disabled { opacity: 0.45; cursor: not-allowed; }
        .btn:hover:not(:disabled) { opacity: 0.88; }
        .back { display: flex; align-items: center; gap: 6px; margin-top: 24px; justify-content: center; font-size: 14px; color: rgba(255,255,255,0.35); text-decoration: none; transition: color 0.2s; }
        .back:hover { color: rgba(255,255,255,0.65); }
        .back svg { width: 14px; height: 14px; }
        .alert-error { background: rgba(220,38,38,0.12); border: 1px solid rgba(220,38,38,0.25); color: #fca5a5; border-radius: 10px; padding: 12px 16px; font-size: 14px; margin-bottom: 20px; }
        .success-box { text-align: center; }
        .success-icon { width: 64px; height: 64px; background: rgba(34,197,94,0.12); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; }
        .success-icon svg { width: 32px; height: 32px; color: #4ade80; }
        .success-title { font-size: 22px; font-weight: 600; color: #fff; margin-bottom: 12px; }
        .success-sub { font-size: 14px; color: rgba(255,255,255,0.45); line-height: 1.7; }
      `}</style>

      <div className="wrap">
        <div className="card">
          {!sent ? (
            <>
              <div className="icon-wrap">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="4" width="20" height="16" rx="3"/>
                  <path d="M2 7l10 7 10-7"/>
                </svg>
              </div>
              <h1>Forgot password?</h1>
              <p>Enter your email and we'll send you a link to reset your password. The link expires in 15 minutes.</p>

              {error && <div className="alert-error">{error}</div>}

              <form onSubmit={handleSubmit}>
                <label>Email address</label>
                <input
                  type="email"
                  placeholder="you@factory.com"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(''); }}
                  required autoFocus
                />
                <button type="submit" className="btn" disabled={loading}>
                  {loading ? 'Sending...' : 'Send reset link'}
                </button>
              </form>
            </>
          ) : (
            <div className="success-box">
              <div className="success-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <div className="success-title">Check your inbox</div>
              <p className="success-sub">
                If <strong style={{color:'rgba(255,255,255,0.65)'}}>{email}</strong> is registered, you'll receive a reset link shortly. Check your spam folder if you don't see it.
              </p>
            </div>
          )}

          <a href="/auth/login" className="back">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Back to sign in
          </a>
        </div>
      </div>
    </>
  );
}
