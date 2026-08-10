import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FileText, Trash2, Search, Upload as UploadIcon, ExternalLink } from 'lucide-react';
import { DocumentsAPI } from '@/api/endpoints';
import { asMessage } from '@/api/client';
import EmptyState from '@/components/EmptyState';
import { ListSkeleton } from '@/components/Skeleton';
import StatusBadge from '@/components/StatusBadge';
import { formatBytes, relativeTime } from '@/utils/format';

export default function Documents() {
  const [query, setQuery] = useState('');
  const qc = useQueryClient();

  const list = useQuery({
    queryKey: ['documents', 'search', query],
    queryFn: () => query.trim() ? DocumentsAPI.search(query) : DocumentsAPI.list(0, 100).then(p => p.content),
  });

  const del = useMutation({
    mutationFn: DocumentsAPI.delete,
    onSuccess: () => {
      toast.success('Document deleted');
      qc.invalidateQueries({ queryKey: ['documents'] });
    },
    onError: (err) => toast.error(asMessage(err)),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Documents</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Browse, search and manage your indexed files.</p>
        </div>
        <Link to="/app/upload" className="btn-primary"><UploadIcon className="h-4 w-4" /> Upload</Link>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="input pl-9"
          placeholder="Search by filename..." />
      </div>

      {list.isLoading && <ListSkeleton rows={5} />}

      {list.data && list.data.length === 0 && (
        <EmptyState
          icon={FileText}
          title="No documents yet"
          description="Upload PDFs, Word docs, or text files to make them searchable by your AI assistant."
          action={<Link to="/app/upload" className="btn-primary"><UploadIcon className="h-4 w-4" /> Upload your first document</Link>} />
      )}

      {list.data && list.data.length > 0 && (
        <div className="space-y-2">
          {list.data.map((d) => (
            <div key={d.id} className="card flex flex-wrap items-center gap-3">
              <div className="rounded-lg bg-zinc-100 p-2 dark:bg-zinc-800"><FileText className="h-5 w-5 text-zinc-500" /></div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{d.filename}</div>
                <div className="text-xs text-zinc-500">
                  {formatBytes(d.fileSize)} - {d.chunkCount} chunks - {relativeTime(d.createdAt)}
                </div>
                {d.errorMessage && <div className="mt-1 text-xs text-red-500">{d.errorMessage}</div>}
              </div>
              <StatusBadge status={d.status} />
              {d.url && (
                <a href={d.url} target="_blank" rel="noreferrer" className="btn-ghost h-8 w-8 p-0">
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
              <button
                onClick={() => {
                  if (confirm(`Delete "${d.filename}"? This removes all indexed chunks.`)) del.mutate(d.id);
                }}
                className="btn-ghost h-8 w-8 p-0 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
