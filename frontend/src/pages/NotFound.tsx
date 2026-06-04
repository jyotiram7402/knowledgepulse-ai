import { Link } from 'react-router-dom';
import Logo from '@/components/Logo';
import ThemeToggle from '@/components/ThemeToggle';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <div className="absolute top-4 right-4"><ThemeToggle /></div>
      <Logo className="mb-6" />
      <div className="text-7xl font-extrabold bg-gradient-to-r from-brand-400 to-brand-700 bg-clip-text text-transparent">
        404
      </div>
      <h1 className="mt-2 text-xl font-semibold">Page not found</h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">The page you&apos;re looking for doesn&apos;t exist.</p>
      <div className="mt-6 flex gap-2">
        <Link to="/" className="btn-secondary">Home</Link>
        <Link to="/app/dashboard" className="btn-primary">Dashboard</Link>
      </div>
    </div>
  );
}
