'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutDashboard, Users, Fingerprint, CalendarClock, CalendarX, Timer, Wallet,
  Receipt, Landmark, Target, GraduationCap, Laptop, ShieldAlert, FileText,
  Building2, ClipboardList, Layers, Briefcase, MapPin, FileSignature, ReceiptText,
  ClipboardCheck, BarChart3, Globe, Menu, LogOut, type LucideIcon,
} from 'lucide-react';
import { auth } from '@/lib/auth';
import { api } from '@/lib/api-client';
import { ThemeToggle } from '@/components/theme-toggle';
import { LanguageSwitcher } from '@/components/language-switcher';
import { NotificationBell } from '@/components/notification-bell';
import { BrandMark } from '@/components/brand-mark';

interface NavItem { href: string; key?: string; label?: string; Icon: LucideIcon }
const NAV_GROUPS: { group: string; items: NavItem[] }[] = [
  { group: 'Utama', items: [{ href: '/dashboard', key: 'dashboard', Icon: LayoutDashboard }] },
  {
    group: 'SDM',
    items: [
      { href: '/employees', key: 'employees', Icon: Users },
      { href: '/attendance', key: 'attendance', Icon: Fingerprint },
      { href: '/shifts', key: 'schedule', Icon: CalendarClock },
      { href: '/leave', key: 'leave', Icon: CalendarX },
      { href: '/overtime', key: 'overtime', Icon: Timer },
      { href: '/payroll', key: 'payroll', Icon: Wallet },
      { href: '/reimbursements', label: 'Reimbursement', Icon: Receipt },
      { href: '/loans', label: 'Pinjaman', Icon: Landmark },
      { href: '/performance', key: 'performance', Icon: Target },
      { href: '/trainings', label: 'Pelatihan', Icon: GraduationCap },
      { href: '/assets', label: 'Aset', Icon: Laptop },
      { href: '/incidents', label: 'Insiden', Icon: ShieldAlert },
      { href: '/documents', key: 'documents', Icon: FileText },
    ],
  },
  {
    group: 'Outsourcing',
    items: [
      { href: '/clients', key: 'clients', Icon: Building2 },
      { href: '/manpower', key: 'manpowerRequest', Icon: ClipboardList },
      { href: '/service-categories', label: 'Kategori Layanan', Icon: Layers },
      { href: '/recruitment', key: 'recruitment', Icon: Briefcase },
      { href: '/placements', key: 'placement', Icon: MapPin },
      { href: '/contracts', label: 'Kontrak', Icon: FileSignature },
      { href: '/invoice', key: 'invoice', Icon: ReceiptText },
    ],
  },
  {
    group: 'Persetujuan & Laporan',
    items: [
      { href: '/approvals', key: 'approvals', Icon: ClipboardCheck },
      { href: '/reports', key: 'reports', Icon: BarChart3 },
    ],
  },
  { group: 'Platform', items: [{ href: '/tenants', label: 'Tenant', Icon: Globe }] },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations('navigation');
  const ta = useTranslations('auth');
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);

  useEffect(() => {
    if (!auth.isAuthenticated) router.replace('/login');
    else setReady(true);
  }, [router]);

  const me = useQuery({ queryKey: ['me'], queryFn: ({ signal }) => api.get<{ email: string; roles: string[] }>('/auth/me', signal), enabled: ready });

  async function logout() {
    try { await api.post('/auth/logout', { refreshToken: auth.refreshToken }); } catch { /* ignore */ }
    auth.clear();
    router.replace('/login');
  }

  const label = (i: NavItem) => (i.key ? t(i.key) : i.label) ?? '';
  const active = NAV_GROUPS.flatMap((g) => g.items).find((i) => pathname.startsWith(i.href));

  if (!ready) return <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">…</div>;

  const SidebarContent = (
    <>
      <div className="flex h-16 shrink-0 items-center gap-2.5 px-5">
        <BrandMark size={34} />
        <div className="leading-tight">
          <div className="text-sm font-bold text-white">KITalent</div>
          <div className="text-[10px] text-sidebar-muted">By Kamunara</div>
        </div>
      </div>
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-6">
        {NAV_GROUPS.map((grp) => (
          <div key={grp.group} className="space-y-1">
            <div className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-sidebar-muted">{grp.group}</div>
            {grp.items.map((item) => {
              const on = pathname.startsWith(item.href);
              const Icon = item.Icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    on ? 'bg-sidebar-accent text-white shadow-sm' : 'text-sidebar-foreground hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon size={18} className={on ? 'text-white' : 'text-sidebar-muted group-hover:text-white'} />
                  {label(item)}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col bg-sidebar md:flex">{SidebarContent}</aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 flex h-full w-64 flex-col bg-sidebar">{SidebarContent}</aside>
        </div>
      )}

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-card/80 px-4 backdrop-blur md:px-6">
          <button className="md:hidden" onClick={() => setMobileOpen(true)} aria-label="menu"><Menu size={20} /></button>
          <h1 className="text-lg font-semibold text-foreground">{active ? label(active) : 'KITalent'}</h1>
          <div className="ml-auto flex items-center gap-1.5">
            <NotificationBell />
            <LanguageSwitcher />
            <ThemeToggle />
            <div className="relative">
              <button onClick={() => setUserMenu((v) => !v)} className="grid h-9 w-9 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                {(me.data?.email ?? 'A').charAt(0).toUpperCase()}
              </button>
              {userMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setUserMenu(false)} />
                  <div className="absolute right-0 z-20 mt-2 w-56 rounded-lg border border-border bg-popover p-1 shadow-lg">
                    <div className="border-b border-border px-3 py-2">
                      <div className="truncate text-sm font-medium text-foreground">{me.data?.email ?? '—'}</div>
                      <div className="truncate text-xs text-muted-foreground">{me.data?.roles?.join(', ') || '—'}</div>
                    </div>
                    <button onClick={logout} className="mt-1 flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-destructive hover:bg-muted">
                      <LogOut size={16} /> {ta('signOut')}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
