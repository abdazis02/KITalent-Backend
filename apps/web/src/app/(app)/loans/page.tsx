'use client';

import { useLocale, useTranslations } from 'next-intl';
import { formatCurrency, type Locale } from '@kitalent/shared';
import { useServerTable } from '@/hooks/use-server-table';
import { DataTable, type Column } from '@/components/data-table/data-table';
import { StatusBadge } from '@/components/status-badge';

interface Loan {
  id: string;
  principalAmount: number | null;
  tenorMonths: number | null;
  status: string;
  createdAt: string;
}

export default function LoansPage() {
  const tc = useTranslations('common');
  const locale = useLocale() as Locale;

  const table = useServerTable<Loan>({
    endpoint: '/loans',
    queryKey: ['loans'],
  });

  const columns: Column<Loan>[] = [
    { key: 'principalAmount', header: 'Pokok Pinjaman', className: 'text-right', render: (r) => (r.principalAmount != null ? formatCurrency(r.principalAmount, locale) : '—') },
    { key: 'tenorMonths', header: 'Tenor (bln)', render: (r) => r.tenorMonths ?? '—' },
    { key: 'createdAt', header: tc('createdAt'), render: (r) => r.createdAt?.slice(0, 10) ?? '—' },
    { key: 'status', header: tc('status'), render: (r) => <StatusBadge value={r.status} /> },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-foreground">Pinjaman</h1>
      <DataTable table={table} columns={columns} getRowId={(r) => r.id} />
    </div>
  );
}
