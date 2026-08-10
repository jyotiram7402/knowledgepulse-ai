import clsx from 'clsx';

export default function Logo({ className }: { className?: string }) {
  return (
    <div className={clsx('flex items-center gap-2', className)}>
      <div className="relative h-8 w-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 shadow-md shadow-brand-500/30">
        <svg viewBox="0 0 24 24" fill="none" className="absolute inset-0 m-auto h-5 w-5 text-white">
          <path d="M4 17 V7 L8 11 L12 7 L16 11 L20 7 V17"
                stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <span className="text-base font-bold tracking-tight">KnowledgePulse <span className="text-brand-500">AI</span></span>
    </div>
  );
}
