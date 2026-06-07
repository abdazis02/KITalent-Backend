'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { formatCurrency, type Locale } from '@kitalent/shared';
import { type Column } from '@/components/data-table/data-table';
import { ResourceManager } from '@/components/crud/resource-manager';
import { StatusBadge } from '@/components/status-badge';
import type { FieldDef } from '@/components/form/form-dialog';

interface Contract {
  id: string;
  number: string;
  title: string;
  type: string;
  status: string;
  endDate: string | null;
  value: number | null;
}

const TYPES = ['pkwt', 'pkwtt', 'client_agreement', 'addendum', 'placement_letter', 'nda', 'offering_letter'];
const STATUSES = ['draft', 'waiting_approval', 'approved', 'sent', 'signed', 'active', 'expired', 'terminated'];

export default function ContractsPage() {
  const t = useTranslations('contract');
  const tc = useTranslations('common');
  const locale = useLocale() as Locale;
  const [status, setStatus] = useState('');

  const columns: Column<Contract>[] = [
    { key: 'number', header: t('number'), render: (r) => <span className="font-medium">{r.number}</span> },
    { key: 'title', header: 'Judul', render: (r) => r.title },
    { key: 'type', header: t('type'), render: (r) => r.type },
    { key: 'endDate', header: t('endDate'), render: (r) => r.endDate?.slice(0, 10) ?? '—' },
    { key: 'value', header: 'Nilai', className: 'text-right', render: (r) => (r.value != null ? formatCurrency(r.value, locale) : '—') },
    { key: 'status', header: tc('status'), render: (r) => <StatusBadge value={r.status} /> },
  ];

  const fields: FieldDef[] = [
    { name: 'number', label: t('number'), required: true },
    { name: 'title', label: 'Judul', required: true },
    { name: 'type', label: t('type'), required: true, options: TYPES.map((v) => ({ value: v, label: v })) },
    { name: 'startDate', label: t('startDate'), type: 'date', required: true },
    { name: 'endDate', label: t('endDate'), type: 'date' },
    { name: 'employeeId', label: 'Karyawan', ref: { endpoint: '/employees', labelKey: 'fullName' } },
    { name: 'clientId', label: 'Klien', ref: { endpoint: '/clients', labelKey: 'name' } },
    { name: 'value', label: 'Nilai', type: 'number' },
    { name: 'notes', label: 'Catatan', type: 'textarea' },
  ];

  return (
    <ResourceManager<Contract>
      title={t('title')}
      endpoint="/contracts"
      queryKey={['contracts']}
      initialSortBy="startDate"
      columns={columns}
      fields={fields}
      canEdit={false}
      canDelete
      filters={{ status: status || undefined }}
      toolbar={
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground">
          <option value="">{tc('all')}</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      }
    />
  );
}
