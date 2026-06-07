'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useServerTable } from '@/hooks/use-server-table';
import { DataTable, type Column } from '@/components/data-table/data-table';
import { StatusBadge } from '@/components/status-badge';

interface Placement {
  id: string;
  position: string | null;
  location: string | null;
  status: string;
  startDate: string;
  employee?: { employeeNo: string; fullName: string } | null;
  client?: { code: string; name: string } | null;
}

const STATUSES = ['draft', 'waiting_approval', 'active', 'on_hold', 'replacement_requested', 'completed', 'cancelled'];

export default function PlacementsPage() {
  const tn = useTranslations('navigation');
  const tc = useTranslations('common');
  const [status, setStatus] = useState('');

  const table = useServerTable<Placement>({
    endpoint: '/placements',
    queryKey: ['placements'],
    initialSortBy: 'startDate',
    filters: { status: status || undefined },
  });

  const columns: Column<Placement>[] = [
    { key: 'employee', header: tn('employees'), render: (r) => r.employee?.fullName ?? '—' },
    { key: 'client', header: tn('clients'), render: (r) => r.client?.name ?? '—' },
    { key: 'position', header: 'Posisi', render: (r) => r.position ?? '—' },
    { key: 'location', header: 'Lokasi', render: (r) => r.location ?? '—' },
    { key: 'startDate', header: 'Mulai', render: (r) => r.startDate?.slice(0, 10) ?? '—' },
    { key: 'status', header: tc('status'), render: (r) => <StatusBadge value={r.status} /> },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-foreground">{tn('placement')}</h1>
      <DataTable
        table={table}
        columns={columns}
        getRowId={(r) => r.id}
        toolbar={
          <select value={status} onChange={(e) => { setStatus(e.target.value); table.setPage(1); }} className="h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground">
            <option value="">{tc('all')}</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        }
      />
    </div>
  );
}
