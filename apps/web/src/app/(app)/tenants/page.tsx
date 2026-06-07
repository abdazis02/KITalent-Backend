'use client';

import { useTranslations } from 'next-intl';
import { useServerTable } from '@/hooks/use-server-table';
import { DataTable, type Column } from '@/components/data-table/data-table';
import { StatusBadge } from '@/components/status-badge';

interface Tenant {
  id: string;
  name: string;
  mode: string;
  plan: string | null;
  status: string;
}

export default function TenantsPage() {
  const tc = useTranslations('common');

  const table = useServerTable<Tenant>({ endpoint: '/tenants', queryKey: ['tenants'] });

  const columns: Column<Tenant>[] = [
    { key: 'name', header: 'Nama', render: (r) => <span className="font-medium">{r.name}</span> },
    { key: 'mode', header: 'Mode', render: (r) => r.mode },
    { key: 'plan', header: 'Paket', render: (r) => r.plan ?? '—' },
    { key: 'status', header: tc('status'), render: (r) => <StatusBadge value={r.status} /> },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-foreground">Tenant (Platform)</h1>
      <DataTable table={table} columns={columns} getRowId={(r) => r.id} />
    </div>
  );
}
