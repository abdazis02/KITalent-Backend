'use client';

import { useTranslations } from 'next-intl';
import { useServerTable } from '@/hooks/use-server-table';
import { DataTable, type Column } from '@/components/data-table/data-table';
import { StatusBadge } from '@/components/status-badge';

interface Asset {
  id: string;
  code: string | null;
  name: string;
  category: string | null;
  status: string;
}

export default function AssetsPage() {
  const tc = useTranslations('common');

  const table = useServerTable<Asset>({ endpoint: '/assets', queryKey: ['assets'] });

  const columns: Column<Asset>[] = [
    { key: 'code', header: 'Kode', render: (r) => r.code ?? '—' },
    { key: 'name', header: 'Nama', render: (r) => <span className="font-medium">{r.name}</span> },
    { key: 'category', header: 'Kategori', render: (r) => r.category ?? '—' },
    { key: 'status', header: tc('status'), render: (r) => <StatusBadge value={r.status} /> },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-foreground">Aset</h1>
      <DataTable table={table} columns={columns} getRowId={(r) => r.id} />
    </div>
  );
}
