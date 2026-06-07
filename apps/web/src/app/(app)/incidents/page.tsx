'use client';

import { useTranslations } from 'next-intl';
import { useServerTable } from '@/hooks/use-server-table';
import { DataTable, type Column } from '@/components/data-table/data-table';
import { StatusBadge } from '@/components/status-badge';

interface Incident {
  id: string;
  title: string;
  severity: string | null;
  status: string;
  createdAt: string;
}

export default function IncidentsPage() {
  const tc = useTranslations('common');

  const table = useServerTable<Incident>({ endpoint: '/incidents', queryKey: ['incidents'] });

  const columns: Column<Incident>[] = [
    { key: 'title', header: 'Judul', render: (r) => <span className="font-medium">{r.title}</span> },
    { key: 'severity', header: 'Tingkat', render: (r) => r.severity ?? '—' },
    { key: 'createdAt', header: tc('createdAt'), render: (r) => r.createdAt?.slice(0, 10) ?? '—' },
    { key: 'status', header: tc('status'), render: (r) => <StatusBadge value={r.status} /> },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-foreground">Insiden</h1>
      <DataTable table={table} columns={columns} getRowId={(r) => r.id} />
    </div>
  );
}
