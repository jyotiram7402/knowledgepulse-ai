import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard, MessageSquare, FileText, Upload, ShieldCheck,
  UserCircle, LogOut, Menu, X, History
} from 'lucide-react';
import clsx from 'clsx';
import Logo from './Logo';
import ThemeToggle from './ThemeToggle';
import { useAuth } from '@/store/auth';
import { UserAPI } from '@/api/endpoints';
import toast from 'react-hot-toast';

interface Item { to: string; label: string; icon: typeof LayoutDashboard; adminOnly?: boolean }

const nav: Item[] = [
  { to: '/app/dashboard', label: 'Dashboard',  icon: LayoutDashboard },
  { to: '/app/chat',      label: 'Chat',       icon: MessageSquare },
  { to: '/app/history',   label: 'Chat history', icon: History },
  { to: '/app/upload',    label: 'Upload',     icon: Upload },
  { to: '/app/documents', label: 'Documents',  icon: FileText },
  { to: '/app/profile',   label: 'Profile',    icon: UserCircle },
  { to: '/app/admin',     label: 'Admin',      icon: ShieldCheck, adminOnly: true },
];

export default function Layout() {
  const { user, setUser, logout, isAdmin, hydrated } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      UserAPI.me().then(setUser).catch(() => {
        logout();
        navigate('/login');
      });
    }
  }, []);

  const items = nav.filter((i) => !i.adminOnly || isAdmin());

  function onLogout() {
    logout();
    toast.success('Signed out');
    navigate('/login');
  }

  if (!hydrated && !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="skeleton h-3 w-40" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className={clsx(
        'fixed inset-y-0 left-0 z-30 w-64 transform border-r border-zinc-200 bg-white p-4 transition-transform duration-200 dark:border-zinc-800 dark:bg-zinc-950',
        'md:relative md:translate-x-0',
        open ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="flex items-center justify-between">
          <Logo />
          <button className="btn-ghost h-8 w-8 p-0 md:hidden" onClick={() => setOpen(false)}>
            <X className="h-4 w-4" />
          </button>
        </div>
        <nav className="mt-6 space-y-1">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-brand-600 text-white'
                    : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100'
                )
              }>
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-4 left-4 right-4 space-y-2">
          <div className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
            <div className="truncate text-sm font-semibold">{user?.name ?? '...'}</div>
            <div className="truncate text-xs text-zinc-500">{user?.email ?? ''}</div>
          </div>
          <button onClick={onLogout} className="btn-ghost w-full justify-start">
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </aside>

      {open && <div className="fixed inset-0 z-20 bg-black/40 md:hidden" onClick={() => setOpen(false)} />}

      {/* Main */}
      <div className="flex flex-1 flex-col min-w-0">
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-zinc-200 bg-white/80 px-4 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
          <button className="btn-ghost h-8 w-8 p-0 md:hidden" onClick={() => setOpen(true)}>
            <Menu className="h-4 w-4" />
          </button>
          <div className="md:hidden"><Logo /></div>
          <div className="flex items-center gap-2 ml-auto">
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
