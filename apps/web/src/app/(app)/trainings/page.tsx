'use client';

import { useTranslations } from 'next-intl';
import { useServerTable } from '@/hooks/use-server-table';
import { DataTable, type Column } from '@/components/data-table/data-table';
import { StatusBadge } from '@/components/status-badge';

interface Training {
  id: string;
  title: string;
  startDate: string | null;
  endDate: string | null;
  status: string;
}

export default function TrainingsPage() {
  const tc = useTranslations('common');

  const table = useServerTable<Training>({ endpoint: '/trainings', queryKey: ['trainings'] });

  const columns: Column<Training>[] = [
    { key: 'title', header: 'Judul', render: (r) => <span className="font-medium">{r.title}</span> },
    { key: 'startDate', header: 'Mulai', render: (r) => r.startDate?.slice(0, 10) ?? '—' },
    { key: 'endDate', header: 'Selesai', render: (r) => r.endDate?.slice(0, 10) ?? '—' },
    { key: 'status', header: tc('status'), render: (r) => <StatusBadge value={r.status} /> },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-foreground">Pelatihan</h1>
      <DataTable table={table} columns={columns} getRowId={(r) => r.id} />
    </div>
  );
}
