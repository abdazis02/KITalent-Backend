'use client';

import { useTranslations } from 'next-intl';
import { type Column } from '@/components/data-table/data-table';
import { ResourceManager } from '@/components/crud/resource-manager';
import type { FieldDef } from '@/components/form/form-dialog';

interface Shift {
  id: string;
  code: string;
  name: string;
  startTime: string | null;
  endTime: string | null;
}

export default function ShiftsPage() {
  const tn = useTranslations('navigation');

  const columns: Column<Shift>[] = [
    { key: 'code', header: 'Kode', render: (r) => r.code },
    { key: 'name', header: 'Nama', render: (r) => <span className="font-medium">{r.name}</span> },
    { key: 'startTime', header: 'Mulai', render: (r) => r.startTime ?? '—' },
    { key: 'endTime', header: 'Selesai', render: (r) => r.endTime ?? '—' },
  ];

  const fields: FieldDef[] = [
    { name: 'code', label: 'Kode', required: true },
    { name: 'name', label: 'Nama', required: true },
    { name: 'startTime', label: 'Jam Mulai (HH:mm)', placeholder: '08:00', required: true },
    { name: 'endTime', label: 'Jam Selesai (HH:mm)', placeholder: '17:00', required: true },
    { name: 'breakStart', label: 'Istirahat Mulai', placeholder: '12:00' },
    { name: 'breakEnd', label: 'Istirahat Selesai', placeholder: '13:00' },
    { name: 'lateToleranceMin', label: 'Toleransi Telat (menit)', type: 'number' },
    { name: 'minWorkingHour', label: 'Jam Kerja Minimal', type: 'number' },
  ];

  return (
    <ResourceManager<Shift>
      title={tn('schedule')}
      endpoint="/shifts"
      queryKey={['shifts']}
      columns={columns}
      fields={fields}
      canDelete
    />
  );
}
