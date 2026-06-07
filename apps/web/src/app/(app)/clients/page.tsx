'use client';

import { useTranslations } from 'next-intl';
import { useServerTable } from '@/hooks/use-server-table';
import { DataTable, type Column } from '@/components/data-table/data-table';

interface Client {
  id: string;
  code: string;
  name: string;
  npwp: string | null;
  isActive: boolean;
  createdAt: string;
}

export default function ClientsPage() {
  const t = useTranslations('navigation');

  const table = useServerTable<Client>({
    endpoint: '/clients',
    queryKey: ['clients'],
    initialSortBy: 'code',
    initialSortOrder: 'asc',
  });

  const columns: Column<Client>[] = [
    { key: 'code', header: 'Kode', sortable: true, render: (r) => <span className="font-medium">{r.code}</span> },
    { key: 'name', header: t('clients'), sortable: true, render: (r) => r.name },
    { key: 'npwp', header: 'NPWP', render: (r) => r.npwp ?? '—' },
    {
      key: 'isActive',
      header: 'Status',
      render: (r) => (
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${r.isActive ? 'bg-success/15 text-success' : 'bg-muted text-muted-foreground'}`}>
          {r.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-foreground">{t('clients')}</h1>
      <DataTable table={table} columns={columns} getRowId={(r) => r.id} />
    </div>
  );
}
