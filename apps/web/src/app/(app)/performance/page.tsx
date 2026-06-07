'use client';

import { useTranslations } from 'next-intl';
import { useServerTable } from '@/hooks/use-server-table';
import { DataTable, type Column } from '@/components/data-table/data-table';
import { StatusBadge } from '@/components/status-badge';

interface Review {
  id: string;
  periodLabel: string | null;
  score: number | null;
  status: string;
  employee?: { fullName: string } | null;
}

export default function PerformancePage() {
  const tn = useTranslations('navigation');
  const tc = useTranslations('common');

  const table = useServerTable<Review>({
    endpoint: '/performance/reviews',
    queryKey: ['performance', 'reviews'],
  });

  const columns: Column<Review>[] = [
    { key: 'employee', header: tn('employees'), render: (r) => r.employee?.fullName ?? '—' },
    { key: 'periodLabel', header: 'Periode', render: (r) => r.periodLabel ?? '—' },
    { key: 'score', header: 'Skor', render: (r) => r.score ?? '—' },
    { key: 'status', header: tc('status'), render: (r) => <StatusBadge value={r.status} /> },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-foreground">{tn('performance')}</h1>
      <DataTable table={table} columns={columns} getRowId={(r) => r.id} />
    </div>
  );
}
