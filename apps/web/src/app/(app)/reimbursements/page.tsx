'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { formatCurrency, type Locale } from '@kitalent/shared';
import { useServerTable } from '@/hooks/use-server-table';
import { DataTable, type Column } from '@/components/data-table/data-table';
import { StatusBadge } from '@/components/status-badge';

interface Reimbursement {
  id: string;
  title: string | null;
  amount: number | null;
  status: string;
  createdAt: string;
}

const STATUSES = ['submitted', 'waiting_approval', 'approved', 'rejected'];

export default function ReimbursementsPage() {
  const tc = useTranslations('common');
  const locale = useLocale() as Locale;
  const [status, setStatus] = useState('');

  const table = useServerTable<Reimbursement>({
    endpoint: '/reimbursements',
    queryKey: ['reimbursements'],
    filters: { status: status || undefined },
  });

  const columns: Column<Reimbursement>[] = [
    { key: 'title', header: 'Keterangan', render: (r) => r.title ?? '—' },
    { key: 'amount', header: 'Jumlah', className: 'text-right', render: (r) => (r.amount != null ? formatCurrency(r.amount, locale) : '—') },
    { key: 'createdAt', header: tc('createdAt'), render: (r) => r.createdAt?.slice(0, 10) ?? '—' },
    { key: 'status', header: tc('status'), render: (r) => <StatusBadge value={r.status} /> },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-foreground">Reimbursement</h1>
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
