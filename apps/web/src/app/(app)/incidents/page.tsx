'use client';

import { useTranslations } from 'next-intl';
import { type Column } from '@/components/data-table/data-table';
import { ResourceManager } from '@/components/crud/resource-manager';
import { StatusBadge } from '@/components/status-badge';
import type { FieldDef } from '@/components/form/form-dialog';

interface Incident {
  id: string;
  title: string;
  severity: string | null;
  status: string;
  createdAt: string;
}

const SEVERITIES = ['low', 'medium', 'high', 'critical'];

export default function IncidentsPage() {
  const tc = useTranslations('common');

  const columns: Column<Incident>[] = [
    { key: 'title', header: 'Judul', render: (r) => <span className="font-medium">{r.title}</span> },
    { key: 'severity', header: 'Tingkat', render: (r) => r.severity ?? '—' },
    { key: 'createdAt', header: tc('createdAt'), render: (r) => r.createdAt?.slice(0, 10) ?? '—' },
    { key: 'status', header: tc('status'), render: (r) => <StatusBadge value={r.status} /> },
  ];

  const fields: FieldDef[] = [
    { name: 'employeeId', label: 'Karyawan', required: true, ref: { endpoint: '/employees', labelKey: 'fullName' } },
    { name: 'category', label: 'Kategori', required: true },
    { name: 'severity', label: 'Tingkat', options: SEVERITIES.map((s) => ({ value: s, label: s })) },
    { name: 'title', label: 'Judul', required: true },
    { name: 'description', label: 'Deskripsi', type: 'textarea' },
    { name: 'incidentDate', label: 'Tanggal Kejadian', type: 'date', required: true },
  ];

  return (
    <ResourceManager<Incident> title="Insiden" endpoint="/incidents" queryKey={['incidents']} columns={columns} fields={fields} canEdit={false} />
  );
}
