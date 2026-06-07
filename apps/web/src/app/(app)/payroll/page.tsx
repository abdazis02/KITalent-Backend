'use client';

import { useLocale, useTranslations } from 'next-intl';
import { formatCurrency, type Locale } from '@kitalent/shared';
import { useServerTable } from '@/hooks/use-server-table';
import { DataTable, type Column } from '@/components/data-table/data-table';

interface PayrollRun {
  id: string;
  periodLabel: string;
  status: string;
  totalGross: number;
  totalNet: number;
  employeeCount: number;
}

export default function PayrollPage() {
  const t = useTranslations('payroll');
  const tn = useTranslations('navigation');
  const locale = useLocale() as Locale;

  const table = useServerTable<PayrollRun>({
    endpoint: '/payroll/runs',
    queryKey: ['payroll', 'runs'],
    initialSortBy: 'periodLabel',
    initialSortOrder: 'desc',
  });

  const columns: Column<PayrollRun>[] = [
    { key: 'periodLabel', header: t('period'), sortable: true, render: (r) => <span className="font-medium">{r.periodLabel}</span> },
    { key: 'employeeCount', header: tn('employees'), render: (r) => r.employeeCount },
    { key: 'totalGross', header: t('totalEarning'), className: 'text-right', render: (r) => formatCurrency(r.totalGross, locale) },
    { key: 'totalNet', header: t('netSalary'), className: 'text-right', render: (r) => formatCurrency(r.totalNet, locale) },
    { key: 'status', header: 'Status', render: (r) => t(`status.${r.status}`) },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-foreground">{t('title')}</h1>
      <DataTable table={table} columns={columns} getRowId={(r) => r.id} />
    </div>
  );
}
