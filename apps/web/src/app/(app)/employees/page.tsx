'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { EMPLOYEE_STATUSES } from '@kitalent/types';
import { useServerTable } from '@/hooks/use-server-table';
import { DataTable, type Column } from '@/components/data-table/data-table';

interface Employee {
  id: string;
  employeeNo: string;
  fullName: string;
  status: string;
  email: string | null;
  nik: string | null;
  basicSalary: number | null;
  createdAt: string;
}

export default function EmployeesPage() {
  const t = useTranslations('navigation');
  const tc = useTranslations('common');
  const [status, setStatus] = useState('');

  const table = useServerTable<Employee>({
    endpoint: '/employees',
    queryKey: ['employees'],
    initialSortBy: 'employeeNo',
    initialSortOrder: 'asc',
    filters: { status: status || undefined },
  });

  const columns: Column<Employee>[] = [
    { key: 'employeeNo', header: 'NIP', sortable: true, render: (r) => <span className="font-medium">{r.employeeNo}</span> },
    { key: 'fullName', header: t('employees'), sortable: true, render: (r) => r.fullName },
    { key: 'email', header: 'Email', render: (r) => r.email ?? '—' },
    {
      key: 'nik',
      header: 'NIK',
      // Masked to null by the API unless the user holds employee.read.sensitive.
      render: (r) => r.nik ?? <span className="text-muted-foreground">••••••</span>,
    },
    {
      key: 'status',
      header: tc('status'),
      sortable: true,
      render: (r) => <StatusBadge value={r.status} />,
    },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-foreground">{t('employees')}</h1>
      <DataTable
        table={table}
        columns={columns}
        getRowId={(r) => r.id}
        toolbar={
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              table.setPage(1);
            }}
            className="h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground"
          >
            <option value="">{tc('all')}</option>
            {EMPLOYEE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        }
      />
    </div>
  );
}

function StatusBadge({ value }: { value: string }) {
  const tone =
    value === 'active'
      ? 'bg-success/15 text-success'
      : value === 'blacklisted' || value === 'terminated'
        ? 'bg-destructive/15 text-destructive'
        : 'bg-muted text-muted-foreground';
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${tone}`}>{value}</span>;
}
