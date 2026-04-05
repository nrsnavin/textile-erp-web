'use client';

import { useState } from 'react';
import Link from 'next/link';
import { authClient } from '@/lib/auth/auth-client';

// Demo tenant ID — seeded by prisma/seed.ts
const DEMO_TENANT_ID = '80472de6-8b83-43bf-a819-d69cd8980524';

const ROLES = [
  { value: 'OWNER',          label: 'Owner — full access' },
  { value: 'MERCHANDISER',   label: 'Merchandiser — orders & buyers' },
  { value: 'PRODUCTION_MGR', label: 'Production Manager' },
  { value: 'STORE_MANAGER',  label: 'Store Manager — POs & suppliers' },
  { value: 'ACCOUNTANT',     label: 'Accountant — invoices & reports' },
  { value: 'QC_INSPECTOR',   label: 'QC Inspector' },
  { value: 'SUPERVISOR',     label: 'Supervisor' },
];

const PW_RULES = [
  { label: 'At least 8 characters',           test: (p: string) => p.length >= 8 },
  { label: 'One uppercase letter',             test: (p: string) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter',             test: (p: string) => /[a-z]/.test(p) },
  { label: 'One number',                       test: (p: string) => /\d/.test(p) },
  { label: 'One special character (@$!%*?&)',  test: (p: string) => /[@$!%*?&]/.test(p) },
];

function getStrength(password: string): number {
  return PW_RULES.filter(r => r.test(password)).length;
}

function strengthLabel(s: number) {
  if (s <= 1) return { text: 'Weak',   cls: 'weak' };
  if (s <= 2) return { text: 'Fair',   cls: 'fair' };
  if (s <= 3) return { text: 'Good',   cls: 'good' };
  return            { text: 'Strong',  cls: 'strong' };
}

export default function RegisterPage() {
  const [form, setForm] = useState({
    name:     '',
    email:    '',
    password: '',
    confirm:  '',
    tenantId: DEMO_TENANT_ID,
    role:     'MERCHANDISER',
  });
  const [showPass, setShowPass]       = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [done, setDone]               = useState<{ message: string; email: string } | null>(null);

  function set(field: keyof typeof form, value: string) {
    setForm(f => ({ ...f, [field]: value }));
    setError('');
  }

  const strength     = getStrength(form.password);
  const strengthInfo = form.password.length > 0 ? strengthLabel(strength) : null;
  const allRulesPassed  = strength === PW_RULES.length;
  const passwordsMatch  = form.password === form.confirm && form.confirm.length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!allRulesPassed) {
      setError('Password does not meet all requirements.');
      return;
    }
    if (!passwordsMatch) {
      setError('Passwords do not match.');
      return;
    }
    if (!form.tenantId.trim()) {
      setError('Organisation ID is required.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const result = await authClient.register({
        name:     form.name.trim(),
        email:    form.email.trim().toLowerCase(),
        password: form.password,
        tenantId: form.tenantId.trim(),
        roles:    [form.role],
      });
      setDone({ message: result.message, email: form.email.trim().toLowerCase() });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // ── Success screen ──────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="register-wrap">
        <div className="success-card">
          <div className="success-icon" style={{ margin: '0 auto 24px' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div className="success-title">Account created!</div>
          <p className="success-sub" style={{ marginBottom: 28 }}>
            {done.message}
          </p>
          <p className="success-sub" style={{ marginBottom: 32, fontSize: 13 }}>
            Check <strong style={{ color: 'rgba(255,255,255,0.65)' }}>{done.email}</strong>{' '}
            for a 6-digit OTP to verify your email before you can sign in.
          </p>
          <Link href="/auth/login" className="btn" style={{ display: 'inline-block', textDecoration: 'none', textAlign: 'center' }}>
            Go to Sign In
          </Link>
        </div>
      </div>
    );
  }

  // ── Registration form ───────────────────────────────────────────────────
  return (
    <div className="register-wrap">
      <div className="register-card">
        <div className="register-header">
          {/* Brand mark */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
            <div
              style={{
                width: 34, height: 34,
                background: 'linear-gradient(135deg, #1e50a0, #2d78d4)',
                borderRadius: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>Textile ERP</span>
          </div>

          <div className="register-title">Create your account</div>
          <p className="register-sub">
            Fill in your details to join your factory workspace.
          </p>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: 20 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Name + Role */}
          <div className="form-row" style={{ marginBottom: 16 }}>
            <div>
              <label>Full name</label>
              <input
                type="text"
                placeholder="Anuja Sharma"
                value={form.name}
                onChange={e => set('name', e.target.value)}
                required
                autoFocus
                autoComplete="name"
              />
            </div>
            <div>
              <label>Role</label>
              <select
                value={form.role}
                onChange={e => set('role', e.target.value)}
              >
                {ROLES.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Email */}
          <div style={{ marginBottom: 16 }}>
            <label>Work email</label>
            <input
              type="email"
              placeholder="you@factory.com"
              value={form.email}
              onChange={e => set('email', e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: 6 }}>
            <label>Password</label>
            <div className="input-wrap">
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="••••••••"
                value={form.password}
                onChange={e => set('password', e.target.value)}
                className={
                  form.password.length > 0
                    ? allRulesPassed ? 'valid' : ''
                    : ''
                }
                required
                autoComplete="new-password"
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                className="pass-toggle"
                onClick={() => setShowPass(s => !s)}
                tabIndex={-1}
              >
                {showPass ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Strength bar */}
          {form.password.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div className="pw-strength">
                {[1, 2, 3, 4, 5].map(i => (
                  <div
                    key={i}
                    className={`pw-bar ${i <= strength && strengthInfo ? strengthInfo.cls : ''}`}
                  />
                ))}
              </div>
              {strengthInfo && (
                <div className={`pw-label ${strengthInfo.cls}`}>{strengthInfo.text}</div>
              )}
            </div>
          )}

          {/* Confirm password */}
          <div style={{ marginBottom: 16 }}>
            <label>Confirm password</label>
            <div className="input-wrap">
              <input
                type={showConfirm ? 'text' : 'password'}
                placeholder="••••••••"
                value={form.confirm}
                onChange={e => set('confirm', e.target.value)}
                className={
                  form.confirm.length > 0
                    ? passwordsMatch ? 'valid' : 'invalid'
                    : ''
                }
                required
                autoComplete="new-password"
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                className="pass-toggle"
                onClick={() => setShowConfirm(s => !s)}
                tabIndex={-1}
              >
                {showConfirm ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Organisation / Tenant ID */}
          <div style={{ marginBottom: 24 }}>
            <label>Organisation ID</label>
            <input
              type="text"
              placeholder="UUID of your tenant"
              value={form.tenantId}
              onChange={e => set('tenantId', e.target.value)}
              required
              spellCheck={false}
              autoComplete="off"
              style={{ fontFamily: 'var(--font-dm-mono, monospace)', fontSize: 13, letterSpacing: '0.02em' }}
            />
            <div className="tenant-hint">
              Demo org: {DEMO_TENANT_ID}
            </div>
          </div>

          <button
            type="submit"
            className="btn"
            disabled={loading || !form.name || !form.email || !allRulesPassed || !passwordsMatch}
          >
            {loading ? (
              <span className="loading-dots"><span /><span /><span /></span>
            ) : (
              'Create account'
            )}
          </button>
        </form>

        <div className="register-footer">
          Already have an account?
          <Link href="/auth/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
