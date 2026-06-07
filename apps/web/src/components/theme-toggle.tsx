'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';

const ORDER = ['system', 'light', 'dark'] as const;
type Mode = (typeof ORDER)[number];

/** Theme cycle (system → light → dark) — icon only. */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const current = (mounted ? (theme as Mode) : 'system') ?? 'system';
  const Icon = current === 'light' ? Sun : current === 'dark' ? Moon : Monitor;
  const next = () => setTheme(ORDER[(ORDER.indexOf(current) + 1) % ORDER.length]);

  return (
    <button
      type="button"
      onClick={next}
      title={`Tema: ${current}`}
      className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      <Icon size={18} />
    </button>
  );
}
