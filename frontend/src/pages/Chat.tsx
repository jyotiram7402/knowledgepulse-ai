import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { MessageSquare, Plus, Send, Trash2, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { ChatAPI } from '@/api/endpoints';
import { asMessage } from '@/api/client';
import EmptyState from '@/components/EmptyState';
import Spinner from '@/components/Spinner';
import { relativeTime } from '@/utils/format';
import type { ChatMessage, Citation } from '@/types';
import clsx from 'clsx';

export default function Chat() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const sessions = useQuery({ queryKey: ['chat', 'sessions'], queryFn: ChatAPI.listSessions });
  const messages = useQuery({
    queryKey: ['chat', 'messages', sessionId],
    queryFn: () => sessionId ? ChatAPI.listMessages(sessionId) : Promise.resolve([] as ChatMessage[]),
    enabled: !!sessionId,
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.data, sessionId]);

  const createSession = useMutation({
    mutationFn: () => ChatAPI.createSession(),
    onSuccess: (s) => {
      qc.invalidateQueries({ queryKey: ['chat', 'sessions'] });
      navigate(`/app/chat/${s.id}`);
    },
    onError: (err) => toast.error(asMessage(err)),
  });

  const deleteSession = useMutation({
    mutationFn: (id: string) => ChatAPI.deleteSession(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['chat', 'sessions'] });
      navigate('/app/chat');
    },
    onError: (err) => toast.error(asMessage(err)),
  });

  const send = useMutation({
    mutationFn: (text: string) => ChatAPI.send(sessionId!, text),
    onMutate: async (text) => {
      await qc.cancelQueries({ queryKey: ['chat', 'messages', sessionId] });
      const prev = qc.getQueryData<ChatMessage[]>(['chat', 'messages', sessionId]) || [];
      const optimistic: ChatMessage = {
        id: 'temp-' + Date.now(),
        role: 'USER',
        content: text,
        citations: [],
        createdAt: new Date().toISOString(),
      };
      qc.setQueryData(['chat', 'messages', sessionId], [...prev, optimistic]);
      return { prev };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['chat', 'messages', sessionId] });
      qc.invalidateQueries({ queryKey: ['chat', 'sessions'] });
    },
    onError: (err, _vars, ctx) => {
      toast.error(asMessage(err));
      if (ctx?.prev) qc.setQueryData(['chat', 'messages', sessionId], ctx.prev);
    },
  });

  async function onSend(e: FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    if (!sessionId) {
      try {
        const s = await ChatAPI.createSession();
        qc.invalidateQueries({ queryKey: ['chat', 'sessions'] });
        navigate(`/app/chat/${s.id}`);
        setTimeout(() => {
          ChatAPI.send(s.id, trimmed).then(() => {
            qc.invalidateQueries({ queryKey: ['chat', 'messages', s.id] });
            qc.invalidateQueries({ queryKey: ['chat', 'sessions'] });
          });
        }, 30);
      } catch (e) {
        toast.error(asMessage(e));
        return;
      }
    } else {
      send.mutate(trimmed);
    }
    setInput('');
  }

  const currentMessages = messages.data ?? [];
  const isThinking = send.isPending;

  return (
    <div className="grid h-[calc(100vh-7rem)] grid-cols-1 gap-4 md:grid-cols-[280px_1fr]">
      {/* Session list */}
      <aside className="card overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-zinc-200 p-3 dark:border-zinc-800">
          <h2 className="text-sm font-semibold">Chats</h2>
          <button onClick={() => createSession.mutate()} className="btn-ghost h-8 w-8 p-0">
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-full space-y-1 overflow-y-auto p-2">
          {sessions.isLoading && <div className="p-3 text-xs text-zinc-500">Loading...</div>}
          {sessions.data && sessions.data.length === 0 && (
            <div className="p-3 text-xs text-zinc-500">No chats yet</div>
          )}
          {sessions.data?.map((s) => (
            <div key={s.id}
                 className={clsx(
                   'group flex items-center justify-between rounded-lg px-2 py-2 cursor-pointer',
                   sessionId === s.id
                     ? 'bg-brand-600 text-white'
                     : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'
                 )}
                 onClick={() => navigate(`/app/chat/${s.id}`)}>
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{s.title}</div>
                <div className={clsx('truncate text-xs', sessionId === s.id ? 'text-brand-100' : 'text-zinc-500')}>
                  {relativeTime(s.updatedAt)}
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm('Delete this chat?')) deleteSession.mutate(s.id);
                }}
                className={clsx('opacity-0 transition-opacity group-hover:opacity-100',
                  sessionId === s.id ? 'text-brand-100 hover:text-white' : 'text-zinc-400 hover:text-red-500')}>
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </aside>

      {/* Conversation */}
      <section className="card flex flex-col p-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!sessionId && (
            <EmptyState
              icon={MessageSquare}
              title="Start a new chat"
              description="Ask anything about your uploaded documents. Answers come with citations."
              action={<button onClick={() => createSession.mutate()} className="btn-primary"><Plus className="h-4 w-4" /> New chat</button>}
            />
          )}

          {sessionId && currentMessages.length === 0 && !messages.isLoading && (
            <EmptyState
              icon={Sparkles}
              title="Ask your first question"
              description="The assistant grounds answers in your indexed documents." />
          )}

          {currentMessages.map((m) => <MessageRow key={m.id} message={m} />)}

          {isThinking && (
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <Spinner /> Thinking...
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={onSend} className="border-t border-zinc-200 p-3 dark:border-zinc-800">
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  onSend(e);
                }
              }}
              rows={1}
              placeholder="Ask your knowledge base anything..."
              className="input min-h-[40px] resize-none" />
            <button type="submit" className="btn-primary" disabled={isThinking || !input.trim()}>
              <Send className="h-4 w-4" />
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function MessageRow({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'USER';
  const annotated = useMemo(() => message.content, [message.content]);
  return (
    <div className={clsx('flex animate-slide-up', isUser ? 'justify-end' : 'justify-start')}>
      <div className={clsx(
        'max-w-[85%] rounded-2xl px-4 py-3 text-sm',
        isUser ? 'bg-brand-600 text-white' : 'bg-zinc-100 dark:bg-zinc-800'
      )}>
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{annotated}</ReactMarkdown>
        </div>
        {!isUser && message.citations.length > 0 && <CitationList citations={message.citations} />}
      </div>
    </div>
  );
}

function CitationList({ citations }: { citations: Citation[] }) {
  return (
    <div className="mt-3 border-t border-zinc-200 pt-3 dark:border-zinc-700">
      <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Sources</div>
      <div className="mt-2 space-y-1.5">
        {citations.map((c) => (
          <details key={c.chunkId} className="rounded-md bg-zinc-50 px-2 py-1.5 dark:bg-zinc-900">
            <summary className="cursor-pointer text-xs font-medium">
              [{c.marker}] chunk #{c.chunkIndex} - {(c.similarity * 100).toFixed(1)}% match
            </summary>
            <p className="mt-2 whitespace-pre-wrap text-xs text-zinc-600 dark:text-zinc-300">{c.snippet}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
