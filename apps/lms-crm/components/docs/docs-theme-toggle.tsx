'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Button } from '@repo/ui/button';

export function DocsThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <Button variant="outline" size="sm" mode="icon" className="size-9 shrink-0" disabled />;
  }

  const isDark = resolvedTheme === 'dark';

  return (
    <Button
      variant="outline"
      size="sm"
      mode="icon"
      className="size-9 shrink-0"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Mode clair' : 'Mode sombre'}
      title={isDark ? 'Mode clair' : 'Mode sombre'}
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}
