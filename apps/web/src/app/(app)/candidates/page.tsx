'use client';

import { useTranslations } from 'next-intl';
import { type Column } from '@/components/data-table/data-table';
import { ResourceManager } from '@/components/crud/resource-manager';
import { StatusBadge } from '@/components/status-badge';
import type { FieldDef } from '@/components/form/form-dialog';

interface Candidate {
  id: string;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  status: string;
}

export default function CandidatesPage() {
  const tc = useTranslations('common');

  const columns: Column<Candidate>[] = [
    { key: 'fullName', header: 'Nama', render: (r) => <span className="font-medium">{r.fullName ?? '—'}</span> },
    { key: 'email', header: 'Email', render: (r) => r.email ?? '—' },
    { key: 'phone', header: 'Telepon', render: (r) => r.phone ?? '—' },
    { key: 'status', header: tc('status'), render: (r) => <StatusBadge value={r.status} /> },
  ];

  const fields: FieldDef[] = [
    { name: 'fullName', label: 'Nama Lengkap', required: true },
    { name: 'email', label: 'Email', type: 'email' },
    { name: 'phone', label: 'Telepon' },
    { name: 'vacancyId', label: 'Lowongan', ref: { endpoint: '/vacancies', labelKey: 'title' } },
    { name: 'source', label: 'Sumber' },
  ];

  return (
    <ResourceManager<Candidate> title="Kandidat" endpoint="/candidates" queryKey={['candidates']} columns={columns} fields={fields} canEdit={false} />
  );
}
