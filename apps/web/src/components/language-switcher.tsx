'use client';

import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { Languages } from 'lucide-react';
import { setLocale } from '@/i18n/actions';

/** Language toggle (id-ID ⇄ en-US) — icon only. Refreshes so server messages reload. */
export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const next = locale === 'id-ID' ? 'en-US' : 'id-ID';

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(async () => { await setLocale(next); router.refresh(); })}
      title={locale === 'id-ID' ? 'Bahasa: Indonesia' : 'Language: English'}
      className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
    >
      <Languages size={18} />
      <span className="text-xs font-bold uppercase">{locale.slice(0, 2)}</span>
    </button>
  );
}
