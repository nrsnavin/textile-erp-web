'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authClient } from '@/lib/auth/auth-client';

export default function ResetPasswordPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const token        = searchParams.get('token') ?? '';

  const [password,  setPassword]  = useState('');
  const [confirm,   setConfirm]   = useState('');
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [done,      setDone]      = useState(false);

  const rules = [
    { label: 'At least 8 characters',          pass: password.length >= 8 },
    { label: 'One uppercase letter',            pass: /[A-Z]/.test(password) },
    { label: 'One number',                      pass: /\d/.test(password) },
    { label: 'One special character (@$!%*?&)', pass: /[@$!%*?&]/.test(password) },
  ];
  const allPassed      = rules.every(r => r.pass);
  const passwordsMatch = password === confirm && confirm.length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!allPassed)      { setError('Password does not meet requirements'); return; }
    if (!passwordsMatch) { setError('Passwords do not match'); return; }
    if (!token)          { setError('Invalid reset link. Please request a new one.'); return; }

    setError(''); setLoading(true);
    try {
      await authClient.resetPassword(token, password);
      setDone(true);
      setTimeout(() => router.push('/auth/login'), 2500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Reset failed. The link may have expired.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="wrap" style={{ width: 440 }}>
      <div className="card">
        {!token ? (
          <div className="no-token">
            <h1>Invalid link</h1>
            <p>This reset link is invalid or has already been used.</p>
            <a href="/auth/forgot-password" className="link-btn">Request a new reset link</a>
          </div>
        ) : done ? (
          <div className="success-box">
            <div className="success-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <div className="success-title">Password reset!</div>
            <p className="success-sub">
              Your password has been updated. Redirecting you to sign in...
            </p>
          </div>
        ) : (
          <>
            <h1>Reset password</h1>
            <p className="sub">Choose a strong password for your account</p>

            {error && <div className="alert alert-error">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="field">
                <label>New password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  className={allPassed ? 'valid' : ''}
                  required autoFocus
                />
              </div>

              {password.length > 0 && (
                <div className="rules">
                  {rules.map(r => (
                    <div key={r.label} className={`rule${r.pass ? ' pass' : ''}`}>
                      <div className="rule-dot" />
                      {r.label}
                    </div>
                  ))}
                </div>
              )}

              <div className="field">
                <label>Confirm password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={confirm}
                  onChange={e => { setConfirm(e.target.value); setError(''); }}
                  className={passwordsMatch ? 'valid' : ''}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn"
                disabled={loading || !allPassed || !passwordsMatch}
              >
                {loading ? 'Resetting...' : 'Reset password'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
