'use client';

import { useTheme } from 'next-themes';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

const OPTIONS = [
  { value: 'system', labelKey: 'themeSystem' },
  { value: 'light', labelKey: 'themeLight' },
  { value: 'dark', labelKey: 'themeDark' },
] as const;

/** Theme selector (system/light/dark) — PRD §14. Labels via i18n. */
export function ThemeToggle() {
  const t = useTranslations('settings');
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="inline-flex rounded-md border border-border bg-card p-0.5" role="group" aria-label={t('theme')}>
      {OPTIONS.map((opt) => {
        const active = mounted && theme === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => setTheme(opt.value)}
            className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
              active
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t(opt.labelKey)}
          </button>
        );
      })}
    </div>
  );
}
