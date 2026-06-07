'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { api, type PaginatedResponse } from '@/lib/api-client';
import { useDebounce } from './use-debounce';

export type SortOrder = 'asc' | 'desc';

interface UseServerTableOptions {
  /** API path without query string, e.g. "/employees". */
  endpoint: string;
  /** react-query key root, e.g. ["employees"]. */
  queryKey: unknown[];
  pageSize?: number;
  initialSortBy?: string;
  initialSortOrder?: SortOrder;
  /** Extra server-side filters (e.g. { status: "active" }). */
  filters?: Record<string, string | undefined>;
}

/**
 * One hook for every data table (rule #2): server-side pagination, debounced
 * search, server-side filter + sort, lazy loading (one page at a time — never
 * all rows), query cache, and a manual `refresh()`. Each distinct param combo
 * is cached under its own query key.
 */
export function useServerTable<T>({
  endpoint,
  queryKey,
  pageSize = 20,
  initialSortBy,
  initialSortOrder = 'desc',
  filters = {},
}: UseServerTableOptions) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<string | undefined>(initialSortBy);
  const [sortOrder, setSortOrder] = useState<SortOrder>(initialSortOrder);
  const debouncedSearch = useDebounce(search, 400);

  // Reset to page 1 whenever the result set changes shape.
  const filterKey = JSON.stringify(filters);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('pageSize', String(pageSize));
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (sortBy) params.set('sortBy', sortBy);
    params.set('sortOrder', sortOrder);
    for (const [k, v] of Object.entries(filters)) if (v) params.set(k, v);
    return params.toString();
  }, [page, pageSize, debouncedSearch, sortBy, sortOrder, filterKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const query = useQuery({
    queryKey: [...queryKey, { page, pageSize, search: debouncedSearch, sortBy, sortOrder, filterKey }],
    queryFn: ({ signal }) => api.get<PaginatedResponse<T>>(`${endpoint}?${queryString}`, signal),
    placeholderData: keepPreviousData,
  });

  function toggleSort(column: string) {
    if (sortBy === column) {
      setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
    setPage(1);
  }

  function onSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  const meta = query.data?.meta;

  return {
    rows: query.data?.data ?? [],
    meta,
    page,
    pageSize,
    setPage,
    search,
    onSearchChange,
    sortBy,
    sortOrder,
    toggleSort,
    /** True only on the very first load → render skeleton. */
    isLoading: query.isLoading,
    /** True on any background refetch → subtle indicator, keep old rows. */
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    /** Manual refresh (rule #1: explicit Refresh button). */
    refresh: query.refetch,
    canPrev: page > 1,
    canNext: meta ? page < meta.totalPages : false,
  };
}
