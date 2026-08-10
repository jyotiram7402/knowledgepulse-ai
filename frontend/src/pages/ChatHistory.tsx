import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { MessageSquare, Plus, Trash2 } from 'lucide-react';
import { ChatAPI } from '@/api/endpoints';
import { asMessage } from '@/api/client';
import { ListSkeleton } from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';
import { relativeTime } from '@/utils/format';

export default function ChatHistory() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const sessions = useQuery({ queryKey: ['chat', 'sessions'], queryFn: ChatAPI.listSessions });

  const create = useMutation({
    mutationFn: () => ChatAPI.createSession(),
    onSuccess: (s) => {
      qc.invalidateQueries({ queryKey: ['chat', 'sessions'] });
      navigate(`/app/chat/${s.id}`);
    },
    onError: (err) => toast.error(asMessage(err)),
  });

  const del = useMutation({
    mutationFn: (id: string) => ChatAPI.deleteSession(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['chat', 'sessions'] });
      toast.success('Chat deleted');
    },
    onError: (err) => toast.error(asMessage(err)),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Chat history</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">All your previous conversations.</p>
        </div>
        <button onClick={() => create.mutate()} className="btn-primary"><Plus className="h-4 w-4" /> New chat</button>
      </div>

      {sessions.isLoading && <ListSkeleton rows={5} />}

      {sessions.data && sessions.data.length === 0 && (
        <EmptyState
          icon={MessageSquare}
          title="No conversations yet"
          description="Start a new chat to ask questions about your uploaded documents."
          action={<button onClick={() => create.mutate()} className="btn-primary"><Plus className="h-4 w-4" /> New chat</button>}
        />
      )}

      {sessions.data && sessions.data.length > 0 && (
        <div className="space-y-2">
          {sessions.data.map((s) => (
            <div key={s.id}
                 className="card flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer"
                 onClick={() => navigate(`/app/chat/${s.id}`)}>
              <div className="flex items-center gap-3 min-w-0">
                <div className="rounded-lg bg-brand-50 p-2 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{s.title}</div>
                  <div className="text-xs text-zinc-500">
                    Created {relativeTime(s.createdAt)} - last activity {relativeTime(s.updatedAt)}
                  </div>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`Delete "${s.title}"?`)) del.mutate(s.id);
                }}
                className="btn-ghost h-8 w-8 p-0 text-zinc-400 hover:text-red-500">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
