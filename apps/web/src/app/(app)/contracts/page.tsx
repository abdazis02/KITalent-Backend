'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { formatCurrency, type Locale } from '@kitalent/shared';
import { useServerTable } from '@/hooks/use-server-table';
import { DataTable, type Column } from '@/components/data-table/data-table';
import { StatusBadge } from '@/components/status-badge';

interface Contract {
  id: string;
  number: string;
  title: string;
  type: string;
  status: string;
  startDate: string;
  endDate: string | null;
  value: number | null;
}

const STATUSES = ['draft', 'waiting_approval', 'approved', 'sent', 'signed', 'active', 'expired', 'terminated'];

export default function ContractsPage() {
  const t = useTranslations('contract');
  const tc = useTranslations('common');
  const locale = useLocale() as Locale;
  const [status, setStatus] = useState('');

  const table = useServerTable<Contract>({
    endpoint: '/contracts',
    queryKey: ['contracts'],
    initialSortBy: 'startDate',
    filters: { status: status || undefined },
  });

  const columns: Column<Contract>[] = [
    { key: 'number', header: t('number'), render: (r) => <span className="font-medium">{r.number}</span> },
    { key: 'title', header: 'Judul', render: (r) => r.title },
    { key: 'type', header: t('type'), render: (r) => r.type },
    { key: 'endDate', header: t('endDate'), render: (r) => r.endDate?.slice(0, 10) ?? '—' },
    { key: 'value', header: 'Nilai', className: 'text-right', render: (r) => (r.value != null ? formatCurrency(r.value, locale) : '—') },
    { key: 'status', header: tc('status'), render: (r) => <StatusBadge value={r.status} /> },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-foreground">{t('title')}</h1>
      <DataTable
        table={table}
        columns={columns}
        getRowId={(r) => r.id}
        toolbar={
          <select value={status} onChange={(e) => { setStatus(e.target.value); table.setPage(1); }} className="h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground">
            <option value="">{tc('all')}</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        }
      />
    </div>
  );
}
