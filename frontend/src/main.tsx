import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});

const stored = localStorage.getItem('kp-theme');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
const initialDark = stored ? stored === 'dark' : prefersDark;
document.documentElement.classList.toggle('dark', initialDark);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            className: '!bg-zinc-900 !text-zinc-50 !border !border-zinc-800',
            duration: 4000,
          }}
        />
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
);
