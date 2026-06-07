'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { EMPLOYEE_STATUSES } from '@kitalent/types';
import { type Column } from '@/components/data-table/data-table';
import { ResourceManager } from '@/components/crud/resource-manager';
import { StatusBadge } from '@/components/status-badge';
import type { FieldDef } from '@/components/form/form-dialog';

interface Employee {
  id: string;
  employeeNo: string;
  fullName: string;
  status: string;
  email: string | null;
  phone: string | null;
}

const EMPLOYMENT_TYPES = ['permanent', 'contract', 'outsourcing', 'daily', 'internship'];

export default function EmployeesPage() {
  const t = useTranslations('navigation');
  const tc = useTranslations('common');
  const [status, setStatus] = useState('');

  const columns: Column<Employee>[] = [
    { key: 'employeeNo', header: 'NIP', sortable: true, render: (r) => <span className="font-medium">{r.employeeNo}</span> },
    { key: 'fullName', header: t('employees'), sortable: true, render: (r) => r.fullName },
    { key: 'email', header: 'Email', render: (r) => r.email ?? '—' },
    { key: 'phone', header: 'Telepon', render: (r) => r.phone ?? '—' },
    { key: 'status', header: tc('status'), sortable: true, render: (r) => <StatusBadge value={r.status} /> },
  ];

  const fields: FieldDef[] = [
    { name: 'employeeNo', label: 'NIP', required: true },
    { name: 'fullName', label: 'Nama Lengkap', required: true },
    { name: 'email', label: 'Email', type: 'email' },
    { name: 'phone', label: 'Telepon' },
    { name: 'status', label: tc('status'), options: (EMPLOYEE_STATUSES as readonly string[]).map((s) => ({ value: s, label: s })) },
    { name: 'employmentType', label: 'Tipe Kepegawaian', options: EMPLOYMENT_TYPES.map((s) => ({ value: s, label: s })) },
    { name: 'gender', label: 'Jenis Kelamin', options: [{ value: 'male', label: 'Laki-laki' }, { value: 'female', label: 'Perempuan' }] },
    { name: 'birthDate', label: 'Tanggal Lahir', type: 'date' },
    { name: 'joinDate', label: 'Tanggal Masuk', type: 'date' },
    { name: 'supervisorId', label: 'Atasan Langsung', ref: { endpoint: '/employees', labelKey: 'fullName' } },
  ];

  return (
    <ResourceManager<Employee>
      title={t('employees')}
      endpoint="/employees"
      queryKey={['employees']}
      initialSortBy="employeeNo"
      initialSortOrder="asc"
      filters={{ status: status || undefined }}
      columns={columns}
      fields={fields}
      canDelete
      toolbar={
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground">
          <option value="">{tc('all')}</option>
          {(EMPLOYEE_STATUSES as readonly string[]).map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      }
    />
  );
}
