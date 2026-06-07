'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ShieldCheck, Users, BarChart3 } from 'lucide-react';
import { api } from '@/lib/api-client';
import { auth } from '@/lib/auth';
import { ThemeToggle } from '@/components/theme-toggle';
import { LanguageSwitcher } from '@/components/language-switcher';

const DEFAULT_TENANT = process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID ?? '11111111-1111-4111-8111-111111111111';

interface LoginResponse { accessToken: string; refreshToken: string }

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
    <main className="flex min-h-screen">
      {/* Brand panel */}
      <div className="relative hidden w-1/2 flex-col justify-between bg-sidebar p-12 text-white lg:flex">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-transparent" />
        <div className="relative flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/15 text-xl font-black">K</span>
          <div>
            <div className="text-xl font-bold">KITalent</div>
            <div className="text-xs text-white/60">By Kamunara</div>
          </div>
        </div>
        <div className="relative space-y-6">
          <h2 className="text-3xl font-bold leading-tight">Platform Manajemen Outsourcing & HRIS</h2>
          <p className="max-w-md text-white/70">Kelola karyawan, absensi, payroll, penempatan klien, dan persetujuan berjenjang dalam satu sistem.</p>
          <div className="space-y-3 pt-2">
            <Feature icon={Users} text="Manajemen tenaga kerja & penempatan klien" />
            <Feature icon={ShieldCheck} text="Persetujuan berjenjang & kontrol akses (RBAC)" />
            <Feature icon={BarChart3} text="Payroll, invoice, dan laporan real-time" />
          </div>
        </div>
        <div className="relative text-xs text-white/40">© {`${2026}`} PT Kamunara Group International</div>
      </div>

      {/* Form panel */}
      <div className="flex w-full flex-col bg-background lg:w-1/2">
        <div className="flex justify-end gap-2 p-4">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="w-full max-w-sm">
            <div className="mb-8 lg:hidden">
              <div className="text-2xl font-bold text-foreground">KITalent</div>
              <div className="text-xs text-muted-foreground">By Kamunara</div>
            </div>
            <h1 className="text-2xl font-bold text-foreground">{t('signInTitle')}</h1>
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

              {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

              <button type="submit" disabled={loading} className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50">
                {loading ? '…' : t('signIn')}
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}

const inputCls = 'w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm text-foreground outline-none ring-ring transition-shadow focus:ring-2';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground">{label}</label>
      {children}
    </div>
  );
}

function Feature({ icon: Icon, text }: { icon: typeof Users; text: string }) {
  return (
    <div className="flex items-center gap-3 text-sm text-white/80">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/10"><Icon size={16} /></span>
      {text}
    </div>
  );
}
