'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { auth } from '@/lib/auth';
import { api } from '@/lib/api-client';
import { ThemeToggle } from '@/components/theme-toggle';
import { LanguageSwitcher } from '@/components/language-switcher';
import { NotificationBell } from '@/components/notification-bell';

const NAV = [
  { href: '/dashboard', key: 'dashboard' },
  { href: '/employees', key: 'employees' },
  { href: '/clients', key: 'clients' },
  { href: '/attendance', key: 'attendance' },
  { href: '/payroll', key: 'payroll' },
  { href: '/invoice', key: 'invoice' },
] as const;

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations('navigation');
  const tc = useTranslations('auth');
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  // Client-side auth guard.
  useEffect(() => {
    if (!auth.isAuthenticated) router.replace('/login');
    else setReady(true);
  }, [router]);

  async function logout() {
    try {
      await api.post('/auth/logout', { refreshToken: auth.refreshToken });
    } catch {
      /* ignore */
    }
    auth.clear();
    router.replace('/login');
  }

  if (!ready) return <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">…</div>;

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="hidden w-60 shrink-0 border-r border-border bg-card md:flex md:flex-col">
        <div className="flex h-14 items-center px-5 text-lg font-bold text-card-foreground">KITalent</div>
        <nav className="flex-1 space-y-0.5 p-3">
          {NAV.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {t(item.key)}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center gap-2 border-b border-border bg-card px-4">
          <div className="ml-auto flex items-center gap-2">
            <NotificationBell />
            <LanguageSwitcher />
            <ThemeToggle />
            <button
              type="button"
              onClick={logout}
              className="rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted"
            >
              {tc('signOut')}
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
