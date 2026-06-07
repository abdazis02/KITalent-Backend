'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { api } from '@/lib/api-client';
import { auth } from '@/lib/auth';
import { ThemeToggle } from '@/components/theme-toggle';
import { LanguageSwitcher } from '@/components/language-switcher';

const DEFAULT_TENANT = process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID ?? '11111111-1111-4111-8111-111111111111';

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
}

export default function LoginPage() {
  const t = useTranslations('auth');
  const router = useRouter();
  const [email, setEmail] = useState('admin@kitalent.app');
  const [password, setPassword] = useState('Password123');
  const [tenantId, setTenantId] = useState(DEFAULT_TENANT);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.post<LoginResponse>('/auth/login', { email, password, tenantId }, { anonymous: true });
      auth.set({ accessToken: res.accessToken, refreshToken: res.refreshToken, tenantId });
      router.replace('/dashboard');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-8 shadow-sm">
        <div className="mb-6 flex items-center justify-between gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>

        <h1 className="text-2xl font-semibold text-card-foreground">{t('signInTitle')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('signInSubtitle')}</p>

        <form className="mt-8 space-y-4" onSubmit={onSubmit}>
          <Field label={t('email')}>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} required />
          </Field>
          <Field label={t('password')}>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} required />
          </Field>
          <Field label="Tenant ID">
            <input value={tenantId} onChange={(e) => setTenantId(e.target.value)} className={inputCls} />
          </Field>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? '…' : t('signIn')}
          </button>
        </form>
      </div>
    </main>
  );
}

const inputCls =
  'w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none ring-ring focus:ring-2';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-card-foreground">{label}</label>
      {children}
    </div>
  );
}
