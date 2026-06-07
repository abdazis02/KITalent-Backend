'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useTransition } from 'react';
import { setLocale } from '@/i18n/actions';

const OPTIONS = [
  { value: 'id-ID', labelKey: 'languageIndonesian' },
  { value: 'en-US', labelKey: 'languageEnglish' },
] as const;

/** Language switcher — PRD §13. Available on login, profile, and settings. */
export function LanguageSwitcher() {
  const t = useTranslations('settings');
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();

  return (
    <div className="inline-flex rounded-md border border-border bg-card p-0.5" role="group" aria-label={t('language')}>
      {OPTIONS.map((opt) => {
        const active = locale === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            disabled={isPending}
            onClick={() => startTransition(() => setLocale(opt.value))}
            className={`rounded px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 ${
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
