'use client';
// frontend/app/auth/reset-password/page.tsx

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authClient } from '../../../lib/auth/auth-client';

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
  const allPassed    = rules.every(r => r.pass);
  const passwordsMatch = password === confirm && confirm.length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!allPassed) { setError('Password does not meet requirements'); return; }
    if (!passwordsMatch) { setError('Passwords do not match'); return; }
    if (!token) { setError('Invalid reset link. Please request a new one.'); return; }

    setError(''); setLoading(true);
    try {
      await authClient.resetPassword(token, password);
      setDone(true);
      setTimeout(() => router.push('/auth/login'), 2500);
    } catch (err: any) {
      setError(err.message ?? 'Reset failed. The link may have expired.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'DM Sans',sans-serif;background:#0a0f1a;min-height:100vh;display:flex;align-items:center;justify-content:center}
        .wrap{width:440px;padding:24px}
        .card{background:#111827;border:1px solid rgba(255,255,255,0.07);border-radius:16px;padding:48px 40px}
        h1{font-size:24px;font-weight:600;color:#fff;letter-spacing:-0.5px;margin-bottom:10px}
        .sub{font-size:14px;color:rgba(255,255,255,0.45);margin-bottom:32px}
        label{display:block;font-size:11px;font-weight:500;text-transform:uppercase;letter-spacing:0.5px;color:rgba(255,255,255,0.45);margin-bottom:8px}
        .field{margin-bottom:20px}
        input{width:100%;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.10);border-radius:10px;padding:14px 16px;font-size:15px;color:#fff;font-family:'DM Sans',sans-serif;outline:none;transition:border-color 0.2s}
        input:focus{border-color:rgba(45,120,212,0.6);background:rgba(45,120,212,0.08)}
        input::placeholder{color:rgba(255,255,255,0.25)}
        input.valid{border-color:rgba(34,197,94,0.5)}
        .rules{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:10px;padding:16px;margin-bottom:20px}
        .rule{display:flex;align-items:center;gap:8px;font-size:13px;color:rgba(255,255,255,0.35);margin-bottom:6px}
        .rule:last-child{margin-bottom:0}
        .rule.pass{color:rgba(74,222,128,0.85)}
        .rule-dot{width:6px;height:6px;border-radius:50%;background:currentColor;flex-shrink:0}
        .btn{width:100%;background:linear-gradient(135deg,#1e50a0,#2d78d4);color:#fff;border:none;border-radius:10px;padding:15px;font-size:15px;font-weight:600;font-family:'DM Sans',sans-serif;cursor:pointer;transition:opacity 0.2s}
        .btn:disabled{opacity:0.45;cursor:not-allowed}
        .btn:hover:not(:disabled){opacity:0.88}
        .alert-error{background:rgba(220,38,38,0.12);border:1px solid rgba(220,38,38,0.25);color:#fca5a5;border-radius:10px;padding:12px 16px;font-size:14px;margin-bottom:20px}
        .success-box{text-align:center}
        .success-icon{width:64px;height:64px;background:rgba(34,197,94,0.12);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 24px}
        .success-icon svg{width:32px;height:32px;color:#4ade80}
        .success-title{font-size:22px;font-weight:600;color:#fff;margin-bottom:12px}
        .success-sub{font-size:14px;color:rgba(255,255,255,0.45);line-height:1.7}
        .no-token{text-align:center;padding:24px 0}
        .no-token p{color:rgba(255,255,255,0.45);font-size:14px;margin-bottom:20px}
        .link-btn{color:#4d9fff;text-decoration:none;font-size:14px}
      `}</style>

      <div className="wrap">
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
              <p className="success-sub">Your password has been updated. Redirecting you to sign in...</p>
            </div>
          ) : (
            <>
              <h1>Reset password</h1>
              <p className="sub">Choose a strong password for your account</p>

              {error && <div className="alert-error">{error}</div>}

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
                        <div className="rule-dot"/>
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
    </>
  );
}
