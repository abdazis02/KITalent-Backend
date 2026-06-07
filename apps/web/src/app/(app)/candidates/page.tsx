'use client';

import { useTranslations } from 'next-intl';
import { useServerTable } from '@/hooks/use-server-table';
import { DataTable, type Column } from '@/components/data-table/data-table';
import { StatusBadge } from '@/components/status-badge';

interface Candidate {
  id: string;
  fullName: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  status: string;
}

export default function CandidatesPage() {
  const tc = useTranslations('common');

  const table = useServerTable<Candidate>({
    endpoint: '/candidates',
    queryKey: ['candidates'],
  });

  const columns: Column<Candidate>[] = [
    { key: 'name', header: 'Nama', render: (r) => r.fullName ?? r.name ?? '—' },
    { key: 'email', header: 'Email', render: (r) => r.email ?? '—' },
    { key: 'phone', header: 'Telepon', render: (r) => r.phone ?? '—' },
    { key: 'status', header: tc('status'), render: (r) => <StatusBadge value={r.status} /> },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-foreground">Kandidat</h1>
      <DataTable table={table} columns={columns} getRowId={(r) => r.id} />
    </div>
  );
}
