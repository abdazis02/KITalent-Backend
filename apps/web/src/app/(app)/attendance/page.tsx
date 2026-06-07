'use client';

import { useLocale, useTranslations } from 'next-intl';
import { formatDate, type Locale } from '@kitalent/shared';
import { useServerTable } from '@/hooks/use-server-table';
import { DataTable, type Column } from '@/components/data-table/data-table';

interface Attendance {
  id: string;
  date: string;
  status: string;
  checkInAt: string | null;
  checkOutAt: string | null;
}

function time(iso: string | null): string {
  return iso ? new Date(iso).toISOString().slice(11, 16) : '—';
}

export default function AttendancePage() {
  const t = useTranslations('attendance');
  const locale = useLocale() as Locale;

  const table = useServerTable<Attendance>({
    endpoint: '/attendances',
    queryKey: ['attendances'],
    initialSortBy: 'date',
    initialSortOrder: 'desc',
  });

  const columns: Column<Attendance>[] = [
    { key: 'date', header: 'Tanggal', sortable: true, render: (r) => formatDate(r.date, locale) },
    { key: 'checkInAt', header: t('checkIn'), render: (r) => time(r.checkInAt) },
    { key: 'checkOutAt', header: t('checkOut'), render: (r) => time(r.checkOutAt) },
    { key: 'status', header: 'Status', render: (r) => t(`status.${r.status}`) },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-foreground">{t('title')}</h1>
      <DataTable table={table} columns={columns} getRowId={(r) => r.id} />
    </div>
  );
}
