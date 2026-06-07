'use client';

import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { Search, RotateCw, ChevronLeft, ChevronRight, Inbox, AlertCircle } from 'lucide-react';
import { useServerTable } from '@/hooks/use-server-table';
import { TableSkeleton } from './table-skeleton';

export interface Column<T> {
  /** Server-side sort key; also used as React key. */
  key: string;
  header: string;
  sortable?: boolean;
  className?: string;
  render: (row: T) => ReactNode;
}

interface DataTableProps<T> {
  table: ReturnType<typeof useServerTable<T>>;
  columns: Column<T>[];
  getRowId: (row: T) => string;
  searchPlaceholder?: string;
  /** Extra server-side filter controls rendered in the toolbar. */
  toolbar?: ReactNode;
}

export function DataTable<T>({ table, columns, getRowId, searchPlaceholder, toolbar }: DataTableProps<T>) {
  const t = useTranslations('common');

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
        <div className="relative w-full max-w-xs">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={table.search}
            onChange={(e) => table.onSearchChange(e.target.value)}
            placeholder={searchPlaceholder ?? t('search')}
            className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm text-foreground outline-none ring-ring transition-shadow focus:ring-2"
          />
        </div>
        {toolbar}
        <div className="ml-auto flex items-center gap-2">
          {table.isFetching && !table.isLoading && <span className="text-xs text-muted-foreground" aria-live="polite">{t('loading')}</span>}
          <button
            type="button"
            onClick={() => table.refresh()}
            disabled={table.isFetching}
            title={t('refresh')}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
          >
            <RotateCw size={15} className={table.isFetching ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">{t('refresh')}</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {columns.map((col) => (
                <th key={col.key} className={`whitespace-nowrap px-4 py-3 ${col.className ?? ''}`}>
                  {col.sortable ? (
                    <button type="button" onClick={() => table.toggleSort(col.key)} className="inline-flex items-center gap-1 hover:text-foreground">
                      {col.header}
                      {table.sortBy === col.key && <span aria-hidden>{table.sortOrder === 'asc' ? '▲' : '▼'}</span>}
                    </button>
                  ) : col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.isLoading ? (
              <TableSkeleton columns={columns.length} />
            ) : table.isError ? (
              <EmptyRow span={columns.length} icon={<AlertCircle className="text-destructive" />} text={String((table.error as Error)?.message ?? 'Error')} tone="text-destructive" />
            ) : table.rows.length === 0 ? (
              <EmptyRow span={columns.length} icon={<Inbox className="text-muted-foreground" />} text={t('noData')} />
            ) : (
              table.rows.map((row) => (
                <tr key={getRowId(row)} className="border-b border-border transition-colors last:border-0 hover:bg-muted/40">
                  {columns.map((col) => (
                    <td key={col.key} className={`px-4 py-3.5 text-card-foreground ${col.className ?? ''}`}>{col.render(row)}</td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-3 text-sm text-muted-foreground">
        <span>
          {table.meta
            ? t('showing', {
                from: (table.page - 1) * table.pageSize + (table.meta.total ? 1 : 0),
                to: Math.min(table.page * table.pageSize, table.meta.total),
                total: table.meta.total,
              })
            : ''}
        </span>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => table.setPage(table.page - 1)} disabled={!table.canPrev || table.isFetching} className="grid h-8 w-8 place-items-center rounded-md border border-border bg-background disabled:opacity-40" aria-label={t('previous')}>
            <ChevronLeft size={16} />
          </button>
          <span className="px-2 text-foreground">{table.page}{table.meta ? ` / ${table.meta.totalPages}` : ''}</span>
          <button type="button" onClick={() => table.setPage(table.page + 1)} disabled={!table.canNext || table.isFetching} className="grid h-8 w-8 place-items-center rounded-md border border-border bg-background disabled:opacity-40" aria-label={t('next')}>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptyRow({ span, icon, text, tone }: { span: number; icon: ReactNode; text: string; tone?: string }) {
  return (
    <tr>
      <td colSpan={span} className="px-4 py-16">
        <div className={`flex flex-col items-center gap-3 ${tone ?? 'text-muted-foreground'}`}>
          <span className="grid h-12 w-12 place-items-center rounded-full bg-muted">{icon}</span>
          <span className="text-sm">{text}</span>
        </div>
      </td>
    </tr>
  );
}
