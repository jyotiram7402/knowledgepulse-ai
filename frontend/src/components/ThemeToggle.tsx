import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/store/theme';

export default function ThemeToggle() {
  const { isDark, toggle } = useTheme();
  return (
    <button onClick={toggle} className="btn-ghost h-9 w-9 p-0" aria-label="Toggle theme">
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
