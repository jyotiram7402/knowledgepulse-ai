import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { AuthAPI } from '@/api/endpoints';
import { asMessage } from '@/api/client';
import { useAuth } from '@/store/auth';
import Logo from '@/components/Logo';
import Spinner from '@/components/Spinner';
import ThemeToggle from '@/components/ThemeToggle';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { setSession } = useAuth();
  const navigate = useNavigate();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await AuthAPI.login(email, password);
      setSession(res.token, res.user);
      toast.success(`Welcome back, ${res.user.name}`);
      navigate('/app/dashboard');
    } catch (err) {
      toast.error(asMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="absolute top-4 right-4"><ThemeToggle /></div>
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6"><Logo /></div>
        <div className="card animate-slide-up">
          <h1 className="text-xl font-bold">Welcome back</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Sign in to your account</p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label className="label">Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                     className="input" placeholder="you@company.com" autoComplete="email" />
            </div>
            <div>
              <label className="label">Password</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                     className="input" placeholder="********" autoComplete="current-password" />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? <Spinner /> : null} Sign in
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
            New here?{' '}
            <Link to="/register" className="font-semibold text-brand-600 hover:text-brand-700">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
