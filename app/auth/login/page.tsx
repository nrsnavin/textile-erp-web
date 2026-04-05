'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth/auth-client';
import { useAuthStore } from '@/lib/stores/auth.store';

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [showPass, setShowPass] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const result = await authClient.login(email, password);
      if (result.accessToken) {
        setAuth(result);
        router.push('/admin/dashboard');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
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
            ) : 'Sign in'}
          </button>
        </form>

        <div className="auth-switch">
          Don&apos;t have an account?
          <a href="/auth/register">Create one</a>
        </div>
      </div>
    </div>
  );
}
