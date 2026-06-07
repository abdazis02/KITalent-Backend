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

interface NavItem { href: string; key?: string; label?: string }
const NAV_GROUPS: { group: string; items: NavItem[] }[] = [
  { group: 'Utama', items: [{ href: '/dashboard', key: 'dashboard' }] },
  {
    group: 'SDM',
    items: [
      { href: '/employees', key: 'employees' },
      { href: '/attendance', key: 'attendance' },
      { href: '/shifts', key: 'schedule' },
      { href: '/leave', key: 'leave' },
      { href: '/overtime', key: 'overtime' },
      { href: '/payroll', key: 'payroll' },
      { href: '/reimbursements', label: 'Reimbursement' },
      { href: '/loans', label: 'Pinjaman' },
      { href: '/performance', key: 'performance' },
      { href: '/trainings', label: 'Pelatihan' },
      { href: '/assets', label: 'Aset' },
      { href: '/incidents', label: 'Insiden' },
      { href: '/documents', key: 'documents' },
    ],
  },
  {
    group: 'Outsourcing',
    items: [
      { href: '/clients', key: 'clients' },
      { href: '/manpower', key: 'manpowerRequest' },
      { href: '/recruitment', key: 'recruitment' },
      { href: '/placements', key: 'placement' },
      { href: '/contracts', label: 'Kontrak' },
      { href: '/invoice', key: 'invoice' },
    ],
  },
  {
    group: 'Persetujuan & Laporan',
    items: [
      { href: '/approvals', key: 'approvals' },
      { href: '/reports', key: 'reports' },
    ],
  },
  { group: 'Platform', items: [{ href: '/tenants', label: 'Tenant' }] },
];

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
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-card md:flex">
        <div className="flex h-14 shrink-0 items-center px-5 text-lg font-bold text-card-foreground">KITalent</div>
        <nav className="flex-1 space-y-4 overflow-y-auto p-3">
          {NAV_GROUPS.map((grp) => (
            <div key={grp.group} className="space-y-0.5">
              <div className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">{grp.group}</div>
              {grp.items.map((item) => {
                const active = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    {item.key ? t(item.key) : item.label}
                  </Link>
                );
              })}
            </div>
          ))}
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
