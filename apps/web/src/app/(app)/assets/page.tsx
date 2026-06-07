'use client';

import { useTranslations } from 'next-intl';
import { type Column } from '@/components/data-table/data-table';
import { ResourceManager } from '@/components/crud/resource-manager';
import { StatusBadge } from '@/components/status-badge';
import type { FieldDef } from '@/components/form/form-dialog';

interface Asset {
  id: string;
  code: string | null;
  name: string;
  category: string | null;
  status: string;
}

export default function AssetsPage() {
  const tc = useTranslations('common');

  const columns: Column<Asset>[] = [
    { key: 'code', header: 'Kode', render: (r) => r.code ?? '—' },
    { key: 'name', header: 'Nama', render: (r) => <span className="font-medium">{r.name}</span> },
    { key: 'category', header: 'Kategori', render: (r) => r.category ?? '—' },
    { key: 'status', header: tc('status'), render: (r) => <StatusBadge value={r.status} /> },
  ];

  const fields: FieldDef[] = [
    { name: 'code', label: 'Kode', required: true },
    { name: 'name', label: 'Nama', required: true },
    { name: 'category', label: 'Kategori' },
    { name: 'serialNumber', label: 'Nomor Seri' },
    { name: 'value', label: 'Nilai', type: 'number' },
    { name: 'location', label: 'Lokasi' },
    { name: 'notes', label: 'Catatan', type: 'textarea' },
  ];

  return (
    <ResourceManager<Asset> title="Aset" endpoint="/assets" queryKey={['assets']} columns={columns} fields={fields} canEdit={false} />
  );
}
