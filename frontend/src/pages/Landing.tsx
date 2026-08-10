import { Link } from 'react-router-dom';
import { Sparkles, Database, MessageSquare, ShieldCheck, ArrowRight, Zap, Search } from 'lucide-react';
import Logo from '@/components/Logo';
import ThemeToggle from '@/components/ThemeToggle';

export default function Landing() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Logo />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link to="/login" className="btn-ghost">Sign in</Link>
          <Link to="/register" className="btn-primary">Get started</Link>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 pt-12 pb-24 text-center">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white/60 px-3 py-1 text-xs font-medium text-zinc-600 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400">
          <Sparkles className="h-3.5 w-3.5 text-brand-500" />
          Enterprise RAG, powered by Gemini & pgvector
        </div>
        <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-extrabold tracking-tight md:text-6xl">
          Chat with your <span className="bg-gradient-to-r from-brand-500 to-brand-700 bg-clip-text text-transparent">knowledge base</span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base text-zinc-500 md:text-lg dark:text-zinc-400">
          Upload PDFs, Word docs, and notes. KnowledgePulse AI grounds every answer in your own content - with citations you can verify.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link to="/register" className="btn-primary px-5 py-2.5">
            Start for free <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to="/login" className="btn-secondary px-5 py-2.5">Sign in</Link>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="grid gap-6 md:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="card hover:shadow-lg transition-shadow">
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="rounded-2xl border border-zinc-200 bg-gradient-to-br from-zinc-50 to-white p-10 text-center dark:border-zinc-800 dark:from-zinc-900 dark:to-zinc-950">
          <h2 className="text-3xl font-bold">Built on a modern stack</h2>
          <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
            Spring Boot 3.5 - React 18 - PostgreSQL + pgvector - Gemini - JWT - Tailwind
          </p>
          <div className="mt-6">
            <Link to="/register" className="btn-primary">Create your account</Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-zinc-200 py-8 text-center text-xs text-zinc-500 dark:border-zinc-800">
        (c) {new Date().getFullYear()} KnowledgePulse AI
      </footer>
    </div>
  );
}

const features = [
  { title: 'Semantic search', body: 'Vector similarity finds the right paragraphs even when keywords do not match.', icon: Search },
  { title: 'Grounded answers', body: 'Every reply is built from your documents and shows the exact source citations.', icon: Database },
  { title: 'Chat history', body: 'Continue conversations across sessions. Your context, persisted.', icon: MessageSquare },
  { title: 'Role-based access', body: 'JWT auth, BCrypt hashing, admin dashboard, audit-friendly metadata.', icon: ShieldCheck },
  { title: 'Fast pipeline', body: 'Upload, extract, chunk and embed - all in a single request.', icon: Zap },
  { title: 'Free to deploy', body: 'Vercel, Render, Neon, Cloudinary, Gemini - 100% free tiers.', icon: Sparkles },
];
