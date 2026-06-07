'use client';

import { useTranslations } from 'next-intl';
import { type Column } from '@/components/data-table/data-table';
import { ResourceManager } from '@/components/crud/resource-manager';
import { StatusBadge } from '@/components/status-badge';
import type { FieldDef } from '@/components/form/form-dialog';

interface ManpowerRequest {
  id: string;
  code: string | null;
  quantity: number | null;
  location: string | null;
  status: string;
  client?: { name: string } | null;
}

export default function ManpowerPage() {
  const tn = useTranslations('navigation');
  const tc = useTranslations('common');

  const columns: Column<ManpowerRequest>[] = [
    { key: 'code', header: 'Kode', render: (r) => r.code ?? '—' },
    { key: 'client', header: tn('clients'), render: (r) => r.client?.name ?? '—' },
    { key: 'quantity', header: 'Jumlah', render: (r) => r.quantity ?? '—' },
    { key: 'location', header: 'Lokasi', render: (r) => r.location ?? '—' },
    { key: 'status', header: tc('status'), render: (r) => <StatusBadge value={r.status} /> },
  ];

  const fields: FieldDef[] = [
    { name: 'code', label: 'Kode', required: true },
    { name: 'clientId', label: 'Klien', required: true, ref: { endpoint: '/clients', labelKey: 'name' } },
    { name: 'serviceCategoryId', label: 'Kategori Layanan', ref: { endpoint: '/service-categories', labelKey: 'name' } },
    { name: 'quantity', label: 'Jumlah', type: 'number', required: true },
    { name: 'location', label: 'Lokasi' },
    { name: 'startDate', label: 'Mulai', type: 'date' },
    { name: 'durationMonths', label: 'Durasi (bulan)', type: 'number' },
    { name: 'qualification', label: 'Kualifikasi', type: 'textarea' },
    { name: 'budget', label: 'Anggaran', type: 'number' },
  ];

  return (
    <ResourceManager<ManpowerRequest>
      title={tn('manpowerRequest')}
      endpoint="/manpower-requests"
      queryKey={['manpower-requests']}
      columns={columns}
      fields={fields}
      canEdit={false}
    />
  );
}
