import axios, { type AxiosInstance, type AxiosRequestConfig, AxiosError } from 'axios';
import { tokenStore, authClient } from '@/lib/auth/auth-client';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3008';

const api: AxiosInstance = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Attach access token to every request
api.interceptors.request.use((config) => {
  const token = tokenStore.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Refresh token on 401
let refreshing: Promise<void> | null = null;

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as AxiosRequestConfig & { _retry?: boolean };
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const rt = tokenStore.getRefreshToken();
      if (rt) {
        if (!refreshing) {
          refreshing = authClient
            .refresh(rt)
            .then((result) => {
              tokenStore.setTokens(result);
            })
            .catch(() => {
              tokenStore.clear();
              if (typeof window !== 'undefined') {
                window.location.href = '/auth/login';
              }
            })
            .finally(() => {
              refreshing = null;
            });
        }
        await refreshing;
        const newToken = tokenStore.getAccessToken();
        if (newToken && original.headers) {
          original.headers.Authorization = `Bearer ${newToken}`;
        }
        return api(original);
      }
      tokenStore.clear();
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  },
);

// Unwrap the backend's { data: ... } envelope
function unwrap<T>(promise: Promise<{ data: { data: T } | T }>): Promise<T> {
  return promise.then((res) => {
    const body = res.data as { data?: T } & T;
    return body.data !== undefined ? (body.data as T) : (body as T);
  });
}

export { api, unwrap };
