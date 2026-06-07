'use client';

import { useTranslations } from 'next-intl';
import { useServerTable } from '@/hooks/use-server-table';
import { DataTable, type Column } from '@/components/data-table/data-table';

interface Shift {
  id: string;
  code: string | null;
  name: string;
  startTime: string | null;
  endTime: string | null;
}

export default function ShiftsPage() {
  const tn = useTranslations('navigation');

  const table = useServerTable<Shift>({ endpoint: '/shifts', queryKey: ['shifts'] });

  const columns: Column<Shift>[] = [
    { key: 'code', header: 'Kode', render: (r) => r.code ?? '—' },
    { key: 'name', header: 'Nama', render: (r) => <span className="font-medium">{r.name}</span> },
    { key: 'startTime', header: 'Mulai', render: (r) => r.startTime ?? '—' },
    { key: 'endTime', header: 'Selesai', render: (r) => r.endTime ?? '—' },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-foreground">{tn('schedule')}</h1>
      <DataTable table={table} columns={columns} getRowId={(r) => r.id} />
    </div>
  );
}
