'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

/**
 * App-wide query defaults. Auto-refresh is intentionally OFF (rule #1: no
 * excessive auto-refresh). Data is cached (staleTime) and pages refresh via an
 * explicit Refresh button; only opted-in queries (notifications, pending
 * approvals) enable polling via their own `refetchInterval`.
 */
export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000, // 30s cache — avoid refetch storms
            gcTime: 5 * 60_000,
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
            retry: 1,
          },
        },
      }),
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
