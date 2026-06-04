import { create } from 'zustand';

interface ThemeState {
  isDark: boolean;
  toggle: () => void;
  set: (dark: boolean) => void;
}

function readInitial(): boolean {
  if (typeof window === 'undefined') return true;
  const stored = localStorage.getItem('kp-theme');
  if (stored) return stored === 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export const useTheme = create<ThemeState>((set) => ({
  isDark: readInitial(),
  toggle: () =>
    set((s) => {
      const next = !s.isDark;
      document.documentElement.classList.toggle('dark', next);
      localStorage.setItem('kp-theme', next ? 'dark' : 'light');
      return { isDark: next };
    }),
  set: (dark) => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('kp-theme', dark ? 'dark' : 'light');
    set({ isDark: dark });
  },
}));
