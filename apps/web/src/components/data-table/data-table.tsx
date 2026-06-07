'use client';

import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
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
      {/* Toolbar: debounced search + filters + manual refresh */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
        <input
          type="search"
          value={table.search}
          onChange={(e) => table.onSearchChange(e.target.value)}
          placeholder={searchPlaceholder ?? t('search')}
          className="h-9 w-full max-w-xs rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none ring-ring focus:ring-2"
        />
        {toolbar}
        <div className="ml-auto flex items-center gap-2">
          {table.isFetching && !table.isLoading && (
            <span className="text-xs text-muted-foreground" aria-live="polite">
              {t('loading')}
            </span>
          )}
          <button
            type="button"
            onClick={() => table.refresh()}
            disabled={table.isFetching}
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
            title={t('refresh')}
          >
            <RefreshIcon spinning={table.isFetching} />
            {t('refresh')}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              {columns.map((col) => (
                <th key={col.key} className={`px-4 py-3 font-medium ${col.className ?? ''}`}>
                  {col.sortable ? (
                    <button
                      type="button"
                      onClick={() => table.toggleSort(col.key)}
                      className="inline-flex items-center gap-1 hover:text-foreground"
                    >
                      {col.header}
                      {table.sortBy === col.key && <span aria-hidden>{table.sortOrder === 'asc' ? '▲' : '▼'}</span>}
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.isLoading ? (
              <TableSkeleton columns={columns.length} />
            ) : table.isError ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-destructive">
                  {String((table.error as Error)?.message ?? 'Error')}
                </td>
              </tr>
            ) : table.rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-muted-foreground">
                  {t('noData')}
                </td>
              </tr>
            ) : (
              table.rows.map((row) => (
                <tr key={getRowId(row)} className="border-b border-border last:border-0 hover:bg-muted/40">
                  {columns.map((col) => (
                    <td key={col.key} className={`px-4 py-3 text-card-foreground ${col.className ?? ''}`}>
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination footer */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border p-3 text-sm text-muted-foreground">
        <span>
          {table.meta
            ? t('showing', {
                from: (table.page - 1) * table.pageSize + (table.meta.total ? 1 : 0),
                to: Math.min(table.page * table.pageSize, table.meta.total),
                total: table.meta.total,
              })
            : ''}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => table.setPage(table.page - 1)}
            disabled={!table.canPrev || table.isFetching}
            className="h-8 rounded-md border border-border bg-background px-3 disabled:opacity-40"
          >
            {t('previous')}
          </button>
          <span className="text-foreground">
            {t('page')} {table.page}
            {table.meta ? ` / ${table.meta.totalPages}` : ''}
          </span>
          <button
            type="button"
            onClick={() => table.setPage(table.page + 1)}
            disabled={!table.canNext || table.isFetching}
            className="h-8 rounded-md border border-border bg-background px-3 disabled:opacity-40"
          >
            {t('next')}
          </button>
        </div>
      </div>
    </div>
  );
}

function RefreshIcon({ spinning }: { spinning?: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={spinning ? 'animate-spin' : ''}
      aria-hidden
    >
      <path d="M3 12a9 9 0 0 1 9-9 9 9 0 0 1 6.7 3L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9 9 0 0 1-6.7-3L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  );
}
