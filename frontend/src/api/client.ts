import axios, { AxiosError, AxiosInstance } from 'axios';
import toast from 'react-hot-toast';
import type { ApiError } from '@/types';

const baseURL = import.meta.env.VITE_API_URL || '/api/v1';

export const api: AxiosInstance = axios.create({
  baseURL,
  timeout: 90_000,
});

const TOKEN_KEY = 'kp-token';

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err: AxiosError<ApiError>) => {
    const status = err.response?.status;
    const message =
      err.response?.data?.message || err.message || 'Something went wrong';

    if (status === 401) {
      setToken(null);
      if (!window.location.pathname.startsWith('/login') &&
          !window.location.pathname.startsWith('/register') &&
          window.location.pathname !== '/') {
        toast.error('Your session expired. Please sign in again.');
        window.location.href = '/login';
      }
    } else if (status === 403) {
      toast.error('You do not have permission to do that.');
    } else if (status && status >= 500) {
      toast.error('Server error. Please try again shortly.');
    }

    return Promise.reject({ ...err, friendlyMessage: message });
  }
);

export function asMessage(err: unknown): string {
  const e = err as { friendlyMessage?: string; message?: string };
  return e?.friendlyMessage || e?.message || 'Something went wrong';
}
