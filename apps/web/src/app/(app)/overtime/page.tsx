'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/api-client';
import { useServerTable } from '@/hooks/use-server-table';
import { DataTable, type Column } from '@/components/data-table/data-table';
import { StatusBadge } from '@/components/status-badge';

interface Overtime {
  id: string;
  date: string;
  durationMinutes: number | null;
  status: string;
  reason: string | null;
}

const STATUSES = ['submitted', 'waiting_approval', 'approved', 'rejected'];
const PENDING = ['submitted', 'waiting_approval'];

export default function OvertimePage() {
  const tn = useTranslations('navigation');
  const tc = useTranslations('common');
  const [status, setStatus] = useState('');

  const table = useServerTable<Overtime>({ endpoint: '/overtimes', queryKey: ['overtimes'], filters: { status: status || undefined } });

  const decide = useMutation({
    mutationFn: (v: { id: string; action: 'approve' | 'reject'; reason?: string }) =>
      api.post(`/overtimes/${v.id}/${v.action}`, v.action === 'reject' ? { reason: v.reason } : undefined),
    onSuccess: () => table.refresh(),
  });

  const columns: Column<Overtime>[] = [
    { key: 'date', header: 'Tanggal', render: (r) => r.date?.slice(0, 10) ?? '—' },
    { key: 'durationMinutes', header: 'Durasi (menit)', render: (r) => r.durationMinutes ?? '—' },
    { key: 'reason', header: 'Alasan', render: (r) => r.reason ?? '—' },
    { key: 'status', header: tc('status'), render: (r) => <StatusBadge value={r.status} /> },
    {
      key: '__actions',
      header: tc('actions'),
      className: 'text-right',
      render: (r) =>
        PENDING.includes(r.status) ? (
          <div className="flex justify-end gap-2">
            <button onClick={() => { const reason = prompt('Alasan penolakan?') ?? ''; if (reason) decide.mutate({ id: r.id, action: 'reject', reason }); }} className="text-xs font-medium text-destructive hover:underline">{tc('reject')}</button>
            <button onClick={() => decide.mutate({ id: r.id, action: 'approve' })} className="text-xs font-medium text-primary hover:underline">{tc('approve')}</button>
          </div>
        ) : <span className="text-xs text-muted-foreground">—</span>,
    },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-foreground">{tn('overtime')}</h1>
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
