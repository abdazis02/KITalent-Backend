'use client';

import { useTranslations } from 'next-intl';
import { type Column } from '@/components/data-table/data-table';
import { ResourceManager } from '@/components/crud/resource-manager';
import type { FieldDef } from '@/components/form/form-dialog';

interface Client {
  id: string;
  code: string;
  name: string;
  industry: string | null;
  picName: string | null;
  picPhone: string | null;
  isActive: boolean;
}

export default function ClientsPage() {
  const tn = useTranslations('navigation');

  const columns: Column<Client>[] = [
    { key: 'code', header: 'Kode', sortable: true, render: (r) => <span className="font-medium">{r.code}</span> },
    { key: 'name', header: 'Nama', sortable: true, render: (r) => r.name },
    { key: 'industry', header: 'Industri', render: (r) => r.industry ?? '—' },
    { key: 'picName', header: 'PIC', render: (r) => r.picName ?? '—' },
    { key: 'picPhone', header: 'Telepon PIC', render: (r) => r.picPhone ?? '—' },
    { key: 'isActive', header: 'Aktif', render: (r) => (r.isActive ? 'Ya' : 'Tidak') },
  ];

  const fields: FieldDef[] = [
    { name: 'code', label: 'Kode', required: true },
    { name: 'name', label: 'Nama', required: true },
    { name: 'legalName', label: 'Nama Legal' },
    { name: 'npwp', label: 'NPWP' },
    { name: 'industry', label: 'Industri' },
    { name: 'address', label: 'Alamat', type: 'textarea' },
    { name: 'picName', label: 'Nama PIC' },
    { name: 'picEmail', label: 'Email PIC', type: 'email' },
    { name: 'picPhone', label: 'Telepon PIC' },
  ];

  return (
    <ResourceManager<Client>
      title={tn('clients')}
      endpoint="/clients"
      queryKey={['clients']}
      initialSortBy="code"
      initialSortOrder="asc"
      columns={columns}
      fields={fields}
      canDelete
    />
  );
}
