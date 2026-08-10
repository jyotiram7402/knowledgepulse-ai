import { create } from 'zustand';
import type { User } from '@/types';
import { setToken, getToken } from '@/api/client';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  hydrated: boolean;
  setSession: (token: string, user: User) => void;
  setUser: (user: User) => void;
  setHydrated: () => void;
  logout: () => void;
  isAdmin: () => boolean;
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  token: getToken(),
  isAuthenticated: Boolean(getToken()),
  hydrated: false,
  setSession: (token, user) => {
    setToken(token);
    set({ token, user, isAuthenticated: true, hydrated: true });
  },
  setUser: (user) => set({ user, isAuthenticated: true, hydrated: true }),
  setHydrated: () => set({ hydrated: true }),
  logout: () => {
    setToken(null);
    set({ user: null, token: null, isAuthenticated: false, hydrated: true });
  },
  isAdmin: () => !!get().user?.roles?.includes('ROLE_ADMIN'),
}));
