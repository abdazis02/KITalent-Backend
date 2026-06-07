'use client';

import { type Column } from '@/components/data-table/data-table';
import { ResourceManager } from '@/components/crud/resource-manager';
import type { FieldDef } from '@/components/form/form-dialog';

interface ServiceCategory {
  id: string;
  code: string;
  name: string;
  minEducation: string | null;
  defaultRate: number | null;
}

export default function ServiceCategoriesPage() {
  const columns: Column<ServiceCategory>[] = [
    { key: 'code', header: 'Kode', render: (r) => <span className="font-medium">{r.code}</span> },
    { key: 'name', header: 'Nama', render: (r) => r.name },
    { key: 'minEducation', header: 'Pendidikan Min.', render: (r) => r.minEducation ?? '—' },
    { key: 'defaultRate', header: 'Tarif Default', className: 'text-right', render: (r) => r.defaultRate ?? '—' },
  ];

  const fields: FieldDef[] = [
    { name: 'code', label: 'Kode', required: true },
    { name: 'name', label: 'Nama', required: true },
    { name: 'description', label: 'Deskripsi', type: 'textarea' },
    { name: 'minEducation', label: 'Pendidikan Minimal' },
    { name: 'minExperienceYears', label: 'Pengalaman Min. (tahun)', type: 'number' },
    { name: 'defaultRate', label: 'Tarif Default', type: 'number' },
  ];

  return (
    <ResourceManager<ServiceCategory> title="Kategori Layanan" endpoint="/service-categories" queryKey={['service-categories']} columns={columns} fields={fields} canEdit={false} />
  );
}
