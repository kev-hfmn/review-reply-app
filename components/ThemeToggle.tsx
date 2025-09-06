'use client';

import { Sun, Moon } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useThemeSafe } from '@/hooks/useThemeSafe';

export function ThemeToggle() {
  const { theme, toggleTheme } = useThemeSafe();

  return (
    <div className="flex items-center gap-2">
      <Sun className="h-4 w-4 text-primary-foreground/80" />
      <Switch
        checked={theme === 'dark'}
        onCheckedChange={toggleTheme}
        aria-label="Toggle theme"
        className="data-[state=checked]:bg-card"
      />
      <Moon className="h-4 w-4 text-primary-foreground/80" />
    </div>
  );
}