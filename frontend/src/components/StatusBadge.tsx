import clsx from 'clsx';

const palette: Record<string, string> = {
  READY:      'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  PROCESSING: 'bg-amber-100   text-amber-700   dark:bg-amber-500/15   dark:text-amber-300',
  PENDING:    'bg-zinc-100    text-zinc-700    dark:bg-zinc-500/15    dark:text-zinc-300',
  FAILED:     'bg-red-100     text-red-700     dark:bg-red-500/15     dark:text-red-300',
};

export default function StatusBadge({ status }: { status: string }) {
  const klass = palette[status] || palette.PENDING;
  return <span className={clsx('badge', klass)}>{status}</span>;
}
