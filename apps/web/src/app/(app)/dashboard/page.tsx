'use client';

import { useQuery } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { formatCurrency, type Locale } from '@kitalent/shared';
import { Users, Building2, MapPin, UserCheck, CalendarX, Timer, FileSignature, Wallet, type LucideIcon } from 'lucide-react';
import { api } from '@/lib/api-client';

interface Dashboard {
  workforce: { employeesActive: number; employeesTotal: number; clientsActive: number; placementsActive: number };
  attendanceToday: { present: number; late: number; absent: number; leave: number };
  approvalsPending: { leaves: number; overtime: number; reimbursements: number };
  contractsExpiringSoon: number;
  billing: { outstandingInvoices: number; outstandingAmount: number };
  payroll: { periodLabel: string; status: string; totalNet: number } | null;
}

type Tone = 'primary' | 'success' | 'warning' | 'info' | 'accent' | 'destructive';
const TONE: Record<Tone, string> = {
  primary: 'bg-primary/12 text-primary',
  success: 'bg-success/15 text-success',
  warning: 'bg-warning/15 text-warning',
  info: 'bg-info/15 text-info',
  accent: 'bg-accent/15 text-accent',
  destructive: 'bg-destructive/15 text-destructive',
};

export default function DashboardPage() {
  const tc = useTranslations('common');
  const locale = useLocale() as Locale;

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['reports', 'dashboard'],
    queryFn: ({ signal }) => api.get<Dashboard>('/reports/dashboard', signal),
  });

  const att = data?.attendanceToday;
  const attTotal = att ? att.present + att.late + att.absent + att.leave : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Ringkasan operasional hari ini</p>
        <button onClick={() => refetch()} disabled={isFetching} className="inline-flex h-9 items-center rounded-md border border-border bg-card px-3 text-sm font-medium hover:bg-muted disabled:opacity-50">
          {tc('refresh')}
        </button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-28 animate-pulse rounded-xl border border-border bg-muted/40" />)}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Stat icon={Users} tone="primary" label="Karyawan Aktif" value={data?.workforce.employeesActive} sub={`dari ${data?.workforce.employeesTotal ?? 0} total`} />
            <Stat icon={Building2} tone="info" label="Client Aktif" value={data?.workforce.clientsActive} />
            <Stat icon={MapPin} tone="accent" label="Penempatan Aktif" value={data?.workforce.placementsActive} />
            <Stat icon={UserCheck} tone="success" label="Hadir Hari Ini" value={att?.present} />
            <Stat icon={CalendarX} tone="warning" label="Cuti Menunggu" value={data?.approvalsPending.leaves} />
            <Stat icon={Timer} tone="warning" label="Lembur Menunggu" value={data?.approvalsPending.overtime} />
            <Stat icon={FileSignature} tone="destructive" label="Kontrak Akan Berakhir" value={data?.contractsExpiringSoon} sub="dalam 30 hari" />
            <Stat icon={Wallet} tone="primary" label="Invoice Outstanding" value={data ? formatCurrency(data.billing.outstandingAmount, locale) : undefined} sub={data ? `${data.billing.outstandingInvoices} invoice` : undefined} />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {/* Attendance breakdown */}
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm lg:col-span-2">
              <h3 className="font-semibold text-foreground">Kehadiran Hari Ini</h3>
              <div className="mt-4 flex h-3 w-full overflow-hidden rounded-full bg-muted">
                {attTotal > 0 && att && (
                  <>
                    <div className="bg-success" style={{ width: `${(att.present / attTotal) * 100}%` }} />
                    <div className="bg-warning" style={{ width: `${(att.late / attTotal) * 100}%` }} />
                    <div className="bg-info" style={{ width: `${(att.leave / attTotal) * 100}%` }} />
                    <div className="bg-destructive" style={{ width: `${(att.absent / attTotal) * 100}%` }} />
                  </>
                )}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Legend color="bg-success" label="Hadir" value={att?.present} />
                <Legend color="bg-warning" label="Telat" value={att?.late} />
                <Legend color="bg-info" label="Cuti" value={att?.leave} />
                <Legend color="bg-destructive" label="Absen" value={att?.absent} />
              </div>
            </div>

            {/* Payroll */}
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <h3 className="font-semibold text-foreground">Payroll Terbaru</h3>
              {data?.payroll ? (
                <div className="mt-4 space-y-2">
                  <div className="text-2xl font-bold text-foreground">{formatCurrency(data.payroll.totalNet, locale)}</div>
                  <div className="text-sm text-muted-foreground">Periode {data.payroll.periodLabel}</div>
                  <span className="inline-block rounded-full bg-primary/12 px-2 py-0.5 text-xs font-medium text-primary">{data.payroll.status}</span>
                </div>
              ) : (
                <p className="mt-4 text-sm text-muted-foreground">{tc('noData')}</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ icon: Icon, tone, label, value, sub }: { icon: LucideIcon; tone: Tone; label: string; value: number | string | undefined; sub?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 truncate text-2xl font-bold text-foreground">{value ?? '—'}</p>
          {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
        </div>
        <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-lg ${TONE[tone]}`}><Icon size={20} /></span>
      </div>
    </div>
  );
}

function Legend({ color, label, value }: { color: string; label: string; value: number | undefined }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="ml-auto text-sm font-semibold text-foreground">{value ?? 0}</span>
    </div>
  );
}
