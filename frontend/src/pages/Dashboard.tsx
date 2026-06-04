import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Database, FileText, MessageSquare, Upload as UploadIcon, ArrowRight } from 'lucide-react';
import { DocumentsAPI, ChatAPI } from '@/api/endpoints';
import { Skeleton } from '@/components/Skeleton';
import { useAuth } from '@/store/auth';
import { formatBytes, relativeTime } from '@/utils/format';
import StatusBadge from '@/components/StatusBadge';

export default function Dashboard() {
  const { user } = useAuth();

  const documents = useQuery({
    queryKey: ['documents', 'page', 0],
    queryFn: () => DocumentsAPI.list(0, 5),
  });
  const sessions = useQuery({
    queryKey: ['chat', 'sessions'],
    queryFn: ChatAPI.listSessions,
  });

  const totalDocs   = documents.data?.totalElements ?? 0;
  const totalChunks = documents.data?.content.reduce((s, d) => s + d.chunkCount, 0) ?? 0;
  const totalChats  = sessions.data?.length ?? 0;

  const tiles = [
    { label: 'Documents',     value: totalDocs,   icon: FileText,      to: '/app/documents' },
    { label: 'Chunks indexed', value: totalChunks, icon: Database,     to: '/app/documents' },
    { label: 'Chats',         value: totalChats,  icon: MessageSquare, to: '/app/chat' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Welcome{user ? `, ${user.name.split(' ')[0]}` : ''}</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Your knowledge assistant overview.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map(({ label, value, icon: Icon, to }) => (
          <Link to={to} key={label} className="card hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-wide text-zinc-500">{label}</div>
                <div className="mt-2 text-3xl font-bold">{value}</div>
              </div>
              <div className="rounded-lg bg-brand-50 p-2.5 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300">
                <Icon className="h-5 w-5" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Recent documents</h2>
            <Link to="/app/documents" className="text-xs font-medium text-brand-600 hover:underline">
              View all <ArrowRight className="inline h-3 w-3" />
            </Link>
          </div>
          <div className="mt-4 space-y-2">
            {documents.isLoading && Array.from({ length: 3 }).map((_, i) =>
              <Skeleton key={i} className="h-12 w-full" />)}
            {documents.data && documents.data.content.length === 0 && (
              <div className="rounded-lg border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-800">
                No documents yet. <Link to="/app/upload" className="text-brand-600 hover:underline">Upload one</Link>
              </div>
            )}
            {documents.data?.content.map((d) => (
              <div key={d.id} className="flex items-center justify-between rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{d.filename}</div>
                  <div className="text-xs text-zinc-500">{formatBytes(d.fileSize)} - {relativeTime(d.createdAt)}</div>
                </div>
                <StatusBadge status={d.status} />
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Recent chats</h2>
            <Link to="/app/chat" className="text-xs font-medium text-brand-600 hover:underline">
              Open chat <ArrowRight className="inline h-3 w-3" />
            </Link>
          </div>
          <div className="mt-4 space-y-2">
            {sessions.isLoading && Array.from({ length: 3 }).map((_, i) =>
              <Skeleton key={i} className="h-12 w-full" />)}
            {sessions.data && sessions.data.length === 0 && (
              <div className="rounded-lg border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-800">
                No chats yet. <Link to="/app/chat" className="text-brand-600 hover:underline">Start one</Link>
              </div>
            )}
            {sessions.data?.slice(0, 5).map((s) => (
              <Link to={`/app/chat/${s.id}`} key={s.id}
                    className="flex items-center justify-between rounded-lg border border-zinc-200 p-3 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900">
                <div className="min-w-0 truncate text-sm font-medium">{s.title}</div>
                <div className="text-xs text-zinc-500">{relativeTime(s.updatedAt)}</div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="card flex flex-col items-start gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-base font-semibold">Add more knowledge</h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Upload PDFs, Word, or text files to expand your assistant&apos;s memory.</p>
        </div>
        <Link to="/app/upload" className="btn-primary"><UploadIcon className="h-4 w-4" /> Upload</Link>
      </div>
    </div>
  );
}
