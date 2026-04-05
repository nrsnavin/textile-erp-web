// frontend/lib/auth/auth-client.ts
// Typed client for all auth API calls

const API = process.env.NEXT_PUBLIC_API_URL ?? '';

export interface LoginResult {
  requiresMfa:  boolean;
  tempToken?:   string;
  message?:     string;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?:   number;
  user?: {
    id:           string;
    email:        string;
    name:         string;
    roles:        string[];
    tenantId:     string;
    isMfaEnabled: boolean;
  };
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json?.errors?.message ?? json?.message ?? 'Request failed');
  }
  return json.data ?? json;
}

async function postAuth<T>(path: string, body: unknown, token: string): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.errors?.message ?? 'Request failed');
  return json.data ?? json;
}

export interface RegisterResult {
  message: string;
  userId:  string;
}

export const authClient = {
  register: (data: {
    name:     string;
    email:    string;
    password: string;
    tenantId: string;
    roles?:   string[];
  }) => post<RegisterResult>('/api/v1/auth/register', data),

  login: (email: string, password: string) =>
    post<LoginResult>('/api/v1/auth/login', { email, password }),

  verifyOtp: (tempToken: string, otp: string) =>
    post<LoginResult>('/api/v1/auth/verify-otp', { tempToken, otp }),

  resendOtp: (tempToken: string) =>
    post<{ message: string }>('/api/v1/auth/resend-otp', { tempToken }),

  refresh: (refreshToken: string) =>
    post<LoginResult>('/api/v1/auth/refresh', { refreshToken }),

  logout: (accessToken: string, refreshToken?: string) =>
    postAuth<{ message: string }>('/api/v1/auth/logout', { refreshToken }, accessToken),

  forgotPassword: (email: string) =>
    post<{ message: string }>('/api/v1/auth/forgot-password', { email }),

  resetPassword: (token: string, newPassword: string) =>
    post<{ message: string }>('/api/v1/auth/reset-password', { token, newPassword }),

  changePassword: (currentPassword: string, newPassword: string, accessToken: string) =>
    postAuth<{ message: string }>(
      '/api/v1/auth/change-password',
      { currentPassword, newPassword },
      accessToken,
    ),
};

// ── Token storage (client-side) ───────────────────────────────────────────
// Stores in memory + httpOnly cookie via server action
// Access token in memory only — never localStorage (XSS risk)

let _accessToken:  string | null = null;
let _refreshToken: string | null = null;
let _user:         LoginResult['user'] | null = null;

export const tokenStore = {
  setTokens(result: LoginResult) {
    _accessToken  = result.accessToken  ?? null;
    _refreshToken = result.refreshToken ?? null;
    _user         = result.user         ?? null;
    // Persist refresh token in sessionStorage (survives page refresh)
    if (typeof window !== 'undefined' && result.refreshToken) {
      sessionStorage.setItem('_rt', result.refreshToken);
    }
  },
  getAccessToken:  () => _accessToken,
  getRefreshToken: () => _refreshToken ?? (
    typeof window !== 'undefined'
      ? sessionStorage.getItem('_rt')
      : null
  ),
  getUser:         () => _user,
  clear() {
    _accessToken = _refreshToken = _user = null;
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('_rt');
    }
  },
};
