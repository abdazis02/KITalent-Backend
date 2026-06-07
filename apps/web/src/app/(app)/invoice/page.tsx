'use client';

import { useLocale, useTranslations } from 'next-intl';
import { formatCurrency, formatDate, type Locale } from '@kitalent/shared';
import { useServerTable } from '@/hooks/use-server-table';
import { DataTable, type Column } from '@/components/data-table/data-table';

interface Invoice {
  id: string;
  invoiceNo: string;
  status: string;
  totalAmount: number;
  paidAmount: number;
  dueDate: string;
}

export default function InvoicePage() {
  const t = useTranslations('invoice');
  const locale = useLocale() as Locale;

  const table = useServerTable<Invoice>({
    endpoint: '/invoices',
    queryKey: ['invoices'],
    initialSortBy: 'issueDate',
    initialSortOrder: 'desc',
  });

  const columns: Column<Invoice>[] = [
    { key: 'invoiceNo', header: t('invoiceNo'), sortable: true, render: (r) => <span className="font-medium">{r.invoiceNo}</span> },
    { key: 'totalAmount', header: t('total'), className: 'text-right', render: (r) => formatCurrency(r.totalAmount, locale) },
    { key: 'paidAmount', header: t('paid'), className: 'text-right', render: (r) => formatCurrency(r.paidAmount, locale) },
    { key: 'dueDate', header: t('dueDate'), render: (r) => formatDate(r.dueDate, locale) },
    { key: 'status', header: 'Status', render: (r) => t(`status.${r.status}`) },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-foreground">{t('title')}</h1>
      <DataTable table={table} columns={columns} getRowId={(r) => r.id} />
    </div>
  );
}
