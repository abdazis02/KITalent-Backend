'use client';

import { useTranslations } from 'next-intl';
import { useServerTable } from '@/hooks/use-server-table';
import { DataTable, type Column } from '@/components/data-table/data-table';
import { StatusBadge } from '@/components/status-badge';

interface ManpowerRequest {
  id: string;
  quantity: number | null;
  location: string | null;
  status: string;
  startDate: string | null;
  client?: { name: string } | null;
}

export default function ManpowerPage() {
  const tn = useTranslations('navigation');
  const tc = useTranslations('common');

  const table = useServerTable<ManpowerRequest>({
    endpoint: '/manpower-requests',
    queryKey: ['manpower-requests'],
  });

  const columns: Column<ManpowerRequest>[] = [
    { key: 'client', header: tn('clients'), render: (r) => r.client?.name ?? '—' },
    { key: 'quantity', header: 'Jumlah', render: (r) => r.quantity ?? '—' },
    { key: 'location', header: 'Lokasi', render: (r) => r.location ?? '—' },
    { key: 'startDate', header: 'Mulai', render: (r) => r.startDate?.slice(0, 10) ?? '—' },
    { key: 'status', header: tc('status'), render: (r) => <StatusBadge value={r.status} /> },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-foreground">{tn('manpowerRequest')}</h1>
      <DataTable table={table} columns={columns} getRowId={(r) => r.id} />
    </div>
  );
}
