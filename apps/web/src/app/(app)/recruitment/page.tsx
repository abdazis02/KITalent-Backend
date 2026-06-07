'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { type Column } from '@/components/data-table/data-table';
import { ResourceManager } from '@/components/crud/resource-manager';
import { StatusBadge } from '@/components/status-badge';
import type { FieldDef } from '@/components/form/form-dialog';

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

  const columns: Column<Vacancy>[] = [
    { key: 'code', header: 'Kode', render: (r) => <span className="font-medium">{r.code}</span> },
    { key: 'title', header: 'Posisi', render: (r) => r.title },
    { key: 'location', header: 'Lokasi', render: (r) => r.location ?? '—' },
    { key: 'quantity', header: 'Kuota', render: (r) => r.quantity ?? '—' },
    { key: 'status', header: tc('status'), render: (r) => <StatusBadge value={r.status} /> },
  ];

  const fields: FieldDef[] = [
    { name: 'code', label: 'Kode', required: true },
    { name: 'title', label: 'Posisi', required: true },
    { name: 'position', label: 'Jabatan' },
    { name: 'location', label: 'Lokasi' },
    { name: 'quantity', label: 'Kuota', type: 'number' },
    { name: 'clientId', label: 'Klien', ref: { endpoint: '/clients', labelKey: 'name' } },
    { name: 'description', label: 'Deskripsi', type: 'textarea' },
    { name: 'requirements', label: 'Persyaratan', type: 'textarea' },
  ];

  return (
    <ResourceManager<Vacancy>
      title={tn('recruitment')}
      endpoint="/vacancies"
      queryKey={['vacancies']}
      columns={columns}
      fields={fields}
      canEdit={false}
      toolbar={<Link href="/candidates" className="text-sm font-medium text-primary hover:underline">Kandidat →</Link>}
    />
  );
}
