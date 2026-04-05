import { create } from 'zustand';
import { tokenStore, type LoginResult } from '@/lib/auth/auth-client';

interface AuthUser {
  id: string;
  email: string;
  name: string;
  roles: string[];
  tenantId: string;
  isMfaEnabled: boolean;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  setAuth: (result: LoginResult) => void;
  clearAuth: () => void;
  initFromSession: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,

  setAuth(result: LoginResult) {
    tokenStore.setTokens(result);
    set({
      user: result.user ?? null,
      isAuthenticated: !!(result.accessToken && result.user),
    });
  },

  clearAuth() {
    tokenStore.clear();
    set({ user: null, isAuthenticated: false });
  },

  initFromSession() {
    const rt = tokenStore.getRefreshToken();
    const user = tokenStore.getUser();
    if (rt && user) {
      set({ user, isAuthenticated: true });
    }
  },
}));
