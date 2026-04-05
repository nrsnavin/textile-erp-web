'use client';

import { useState } from 'react';
import { authClient } from '@/lib/auth/auth-client';

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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
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
            <p>
              Enter your email and we&apos;ll send you a link to reset your password.
              The link expires in 15 minutes.
            </p>

            {error && <div className="alert alert-error">{error}</div>}

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
              If <strong style={{ color: 'rgba(255,255,255,0.65)' }}>{email}</strong> is
              registered, you&apos;ll receive a reset link shortly. Check your spam folder
              if you don&apos;t see it.
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
  );
}
