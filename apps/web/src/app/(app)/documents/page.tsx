'use client';

import { useTranslations } from 'next-intl';
import { useServerTable } from '@/hooks/use-server-table';
import { DataTable, type Column } from '@/components/data-table/data-table';

interface Doc {
  id: string;
  name: string | null;
  title: string | null;
  type: string | null;
  documentType: string | null;
  createdAt: string;
}

export default function DocumentsPage() {
  const tn = useTranslations('navigation');
  const tc = useTranslations('common');

  const table = useServerTable<Doc>({ endpoint: '/documents', queryKey: ['documents'] });

  const columns: Column<Doc>[] = [
    { key: 'name', header: 'Nama', render: (r) => <span className="font-medium">{r.name ?? r.title ?? '—'}</span> },
    { key: 'type', header: 'Jenis', render: (r) => r.type ?? r.documentType ?? '—' },
    { key: 'createdAt', header: tc('createdAt'), render: (r) => r.createdAt?.slice(0, 10) ?? '—' },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-foreground">{tn('documents')}</h1>
      <DataTable table={table} columns={columns} getRowId={(r) => r.id} />
    </div>
  );
}
