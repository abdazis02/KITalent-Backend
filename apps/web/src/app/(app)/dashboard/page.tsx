'use client';

import { useQuery } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { formatCurrency, type Locale } from '@kitalent/shared';
import { api } from '@/lib/api-client';

interface Dashboard {
  workforce: { employeesActive: number; employeesTotal: number; clientsActive: number; placementsActive: number };
  attendanceToday: { present: number; late: number; absent: number; leave: number };
  approvalsPending: { leaves: number; overtime: number; reimbursements: number };
  contractsExpiringSoon: number;
  billing: { outstandingInvoices: number; outstandingAmount: number };
  payroll: { periodLabel: string; status: string; totalNet: number } | null;
}

export default function DashboardPage() {
  const t = useTranslations('navigation');
  const tc = useTranslations('common');
  const locale = useLocale() as Locale;

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['reports', 'dashboard'],
    queryFn: () => api.get<Dashboard>('/reports/dashboard'),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">{t('dashboard')}</h1>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex h-9 items-center rounded-md border border-border bg-background px-3 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
        >
          {tc('refresh')}
        </button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg border border-border bg-muted/40" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Karyawan Aktif" value={data?.workforce.employeesActive} />
          <Stat label="Client Aktif" value={data?.workforce.clientsActive} />
          <Stat label="Penempatan Aktif" value={data?.workforce.placementsActive} />
          <Stat label="Hadir Hari Ini" value={data?.attendanceToday.present} />
          <Stat label="Approval Cuti Pending" value={data?.approvalsPending.leaves} />
          <Stat label="Lembur Pending" value={data?.approvalsPending.overtime} />
          <Stat label="Kontrak Akan Berakhir" value={data?.contractsExpiringSoon} />
          <Stat
            label="Invoice Outstanding"
            value={data ? formatCurrency(data.billing.outstandingAmount, locale) : undefined}
            sub={data ? `${data.billing.outstandingInvoices} invoice` : undefined}
          />
        </div>
      )}

      {data?.payroll && (
        <div className="rounded-lg border border-border bg-card p-4 text-sm text-card-foreground">
          Payroll terbaru: <strong>{data.payroll.periodLabel}</strong> ({data.payroll.status}) — net{' '}
          {formatCurrency(data.payroll.totalNet, locale)}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: number | string | undefined; sub?: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-card-foreground">{value ?? '—'}</p>
      {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}
