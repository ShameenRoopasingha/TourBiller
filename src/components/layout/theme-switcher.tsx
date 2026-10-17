'use client';

import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export function ThemeSwitcher({ className }: { className?: string } = {}) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) {
    return <div className={cn("h-9 w-9 rounded-full bg-secondary/50 animate-pulse", className)} />;
  }

  const isDark = resolvedTheme === 'dark';

  const toggleTheme = () => {
    const nextTheme = isDark ? 'light' : 'dark';
    const doc = document as Document & {
      startViewTransition?: (callback: () => void) => void;
    };
    if (!doc.startViewTransition) {
      setTheme(nextTheme);
      return;
    }
    doc.startViewTransition(() => setTheme(nextTheme));
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        "group relative inline-flex h-9 w-9 items-center justify-center rounded-full btn-tactile-secondary cursor-pointer",
        className
      )}
      aria-label="Toggle color theme"
    >
      <Sun className="h-4 w-4 text-amber-500 dark:text-amber-400 transition-all duration-300 rotate-0 scale-100 dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 text-indigo-600 dark:text-indigo-300 transition-all duration-300 rotate-90 scale-0 dark:rotate-0 dark:scale-100" />
    </button>
  );
}
