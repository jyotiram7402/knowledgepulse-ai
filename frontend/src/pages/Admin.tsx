import { useQuery } from '@tanstack/react-query';
import { Users, FileText, Database, MessageSquare, Layers, UserCheck } from 'lucide-react';
import { AdminAPI } from '@/api/endpoints';
import { Skeleton, ListSkeleton } from '@/components/Skeleton';
import StatusBadge from '@/components/StatusBadge';
import { formatBytes, relativeTime } from '@/utils/format';

export default function Admin() {
  const stats = useQuery({ queryKey: ['admin', 'stats'], queryFn: AdminAPI.stats });
  const users = useQuery({ queryKey: ['admin', 'users'], queryFn: AdminAPI.users });
  const documents = useQuery({ queryKey: ['admin', 'documents'], queryFn: AdminAPI.documents });

  const tiles = [
    { label: 'Total users',     icon: Users,         value: stats.data?.totalUsers ?? 0 },
    { label: 'Active users',    icon: UserCheck,     value: stats.data?.activeUsers ?? 0 },
    { label: 'Documents',       icon: FileText,      value: stats.data?.totalDocuments ?? 0 },
    { label: 'Chunks indexed',  icon: Database,      value: stats.data?.totalChunks ?? 0 },
    { label: 'Chat sessions',   icon: Layers,        value: stats.data?.totalSessions ?? 0 },
    { label: 'Chat messages',   icon: MessageSquare, value: stats.data?.totalMessages ?? 0 },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Admin dashboard</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">System metrics, users, and document inventory.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map((t) => (
          <div key={t.label} className="card">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-wide text-zinc-500">{t.label}</div>
                <div className="mt-2 text-3xl font-bold">
                  {stats.isLoading ? <Skeleton className="h-7 w-12" /> : t.value}
                </div>
              </div>
              <div className="rounded-lg bg-brand-50 p-2.5 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300">
                <t.icon className="h-5 w-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Users</h2>
        {users.isLoading && <ListSkeleton rows={4} />}
        {users.data && users.data.length === 0 && (
          <div className="card text-sm text-zinc-500">No users yet.</div>
        )}
        {users.data && users.data.length > 0 && (
          <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 text-left text-xs uppercase text-zinc-500 dark:bg-zinc-900">
                <tr>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Roles</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {users.data.map((u) => (
                  <tr key={u.id}>
                    <td className="px-3 py-2 font-medium">{u.name}</td>
                    <td className="px-3 py-2 text-zinc-500">{u.email}</td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-1">
                        {u.roles.map((r) => (
                          <span key={r} className="badge bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">{r}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <span className={'badge ' + (u.enabled
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                        : 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300')}>
                        {u.enabled ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-zinc-500">{relativeTime(u.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Documents</h2>
        {documents.isLoading && <ListSkeleton rows={4} />}
        {documents.data && documents.data.length === 0 && (
          <div className="card text-sm text-zinc-500">No documents uploaded yet.</div>
        )}
        {documents.data && documents.data.length > 0 && (
          <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 text-left text-xs uppercase text-zinc-500 dark:bg-zinc-900">
                <tr>
                  <th className="px-3 py-2">Filename</th>
                  <th className="px-3 py-2">Owner</th>
                  <th className="px-3 py-2">Size</th>
                  <th className="px-3 py-2">Chunks</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Uploaded</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {documents.data.map((d) => (
                  <tr key={d.id}>
                    <td className="px-3 py-2 font-medium">{d.filename}</td>
                    <td className="px-3 py-2 text-zinc-500">{d.ownerName} <span className="text-xs">({d.ownerEmail})</span></td>
                    <td className="px-3 py-2 text-zinc-500">{formatBytes(d.fileSize)}</td>
                    <td className="px-3 py-2">{d.chunkCount}</td>
                    <td className="px-3 py-2"><StatusBadge status={d.status} /></td>
                    <td className="px-3 py-2 text-zinc-500">{relativeTime(d.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
