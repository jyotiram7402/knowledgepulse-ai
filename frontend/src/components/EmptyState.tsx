import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

interface Props {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}

export default function EmptyState({ icon: Icon, title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-white/50 px-6 py-12 text-center dark:border-zinc-800 dark:bg-zinc-900/40">
      <div className="mb-4 rounded-full bg-zinc-100 p-3 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-base font-semibold">{title}</h3>
      {description && <p className="mt-1 max-w-md text-sm text-zinc-500 dark:text-zinc-400">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
