'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useServerTable } from '@/hooks/use-server-table';
import { DataTable, type Column } from '@/components/data-table/data-table';
import { StatusBadge } from '@/components/status-badge';

interface Vacancy {
  id: string;
  code: string;
  title: string;
  location: string | null;
  quantity: number | null;
  status: string;
}

export default function RecruitmentPage() {
  const tn = useTranslations('navigation');
  const tc = useTranslations('common');

  const table = useServerTable<Vacancy>({
    endpoint: '/vacancies',
    queryKey: ['vacancies'],
  });

  const columns: Column<Vacancy>[] = [
    { key: 'code', header: 'Kode', render: (r) => <span className="font-medium">{r.code}</span> },
    { key: 'title', header: 'Posisi', render: (r) => r.title },
    { key: 'location', header: 'Lokasi', render: (r) => r.location ?? '—' },
    { key: 'quantity', header: 'Kuota', render: (r) => r.quantity ?? '—' },
    { key: 'status', header: tc('status'), render: (r) => <StatusBadge value={r.status} /> },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">{tn('recruitment')}</h1>
        <Link href="/candidates" className="text-sm font-medium text-primary hover:underline">Kandidat →</Link>
      </div>
      <DataTable table={table} columns={columns} getRowId={(r) => r.id} />
    </div>
  );
}
