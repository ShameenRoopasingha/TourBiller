'use client';

import { useTheme } from 'next-themes';
import { Moon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export function ThemeSwitcher({ className }: { className?: string } = {}) {
  const { setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setTheme('dark');
  }, [setTheme]);

  if (!mounted) {
    return <div className={cn("h-9 w-9 rounded-full bg-secondary/50 animate-pulse", className)} />;
  }

  return (
    <button
      type="button"
      className={cn(
        "group relative inline-flex h-9 w-9 items-center justify-center rounded-full btn-tactile-secondary cursor-default border border-border/80 shadow-[0_0_15px_-3px_rgba(232,115,42,0.3)]",
        className
      )}
      aria-label="Bitgard Dark Mode Active"
      title="Bitgard Dark Mode Active"
    >
      <Moon className="h-4 w-4 text-primary transition-all duration-300" />
    </button>
  );
}
