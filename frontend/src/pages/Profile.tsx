import { FormEvent, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { UserAPI } from '@/api/endpoints';
import { asMessage } from '@/api/client';
import { useAuth } from '@/store/auth';
import Spinner from '@/components/Spinner';
import { formatDate } from '@/utils/format';

export default function Profile() {
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { setName(user?.name ?? ''); }, [user?.name]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const updated = await UserAPI.update({
        name: name.trim() || undefined,
        currentPassword: newPassword ? currentPassword : undefined,
        newPassword: newPassword || undefined,
      });
      setUser(updated);
      toast.success('Profile updated');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      toast.error(asMessage(err));
    } finally {
      setLoading(false);
    }
  }

  if (!user) return null;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Manage your account.</p>
      </div>

      <div className="card">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-lg font-bold text-white">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="text-base font-semibold">{user.name}</div>
            <div className="text-sm text-zinc-500">{user.email}</div>
            <div className="mt-1 flex flex-wrap gap-1">
              {user.roles.map((r) => (
                <span key={r} className="badge bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">{r}</span>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-4 text-xs text-zinc-500">Member since {formatDate(user.createdAt)}</div>
      </div>

      <form onSubmit={onSubmit} className="card space-y-4">
        <h2 className="text-base font-semibold">Edit details</h2>
        <div>
          <label className="label">Display name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="input" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="label">Current password</label>
            <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
                   className="input" autoComplete="current-password" placeholder="Required to change password" />
          </div>
          <div>
            <label className="label">New password</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                   className="input" autoComplete="new-password" placeholder="At least 8 characters" />
          </div>
        </div>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? <Spinner /> : null} Save changes
        </button>
      </form>
    </div>
  );
}
