'use client';

import { useTranslations } from 'next-intl';
import { type Column } from '@/components/data-table/data-table';
import { ResourceManager } from '@/components/crud/resource-manager';
import { StatusBadge } from '@/components/status-badge';
import type { FieldDef } from '@/components/form/form-dialog';

interface Training {
  id: string;
  code: string | null;
  title: string;
  scheduledAt: string | null;
  status: string;
}

export default function TrainingsPage() {
  const tc = useTranslations('common');

  const columns: Column<Training>[] = [
    { key: 'code', header: 'Kode', render: (r) => r.code ?? '—' },
    { key: 'title', header: 'Judul', render: (r) => <span className="font-medium">{r.title}</span> },
    { key: 'scheduledAt', header: 'Jadwal', render: (r) => r.scheduledAt?.slice(0, 10) ?? '—' },
    { key: 'status', header: tc('status'), render: (r) => <StatusBadge value={r.status} /> },
  ];

  const fields: FieldDef[] = [
    { name: 'code', label: 'Kode', required: true },
    { name: 'title', label: 'Judul', required: true },
    { name: 'description', label: 'Deskripsi', type: 'textarea' },
    { name: 'trainer', label: 'Pelatih' },
    { name: 'location', label: 'Lokasi' },
    { name: 'scheduledAt', label: 'Jadwal', type: 'date' },
  ];

  return (
    <ResourceManager<Training> title="Pelatihan" endpoint="/trainings" queryKey={['trainings']} columns={columns} fields={fields} canEdit={false} />
  );
}
