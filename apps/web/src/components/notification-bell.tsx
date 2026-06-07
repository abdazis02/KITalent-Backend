'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';

/**
 * Header bell. This is one of the few places auto-refresh is allowed (rule #1:
 * only important/realtime data). Polls the unread count every 30s.
 */
export function NotificationBell() {
  const { data } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => api.get<{ unread: number }>('/notifications/unread-count'),
    refetchInterval: 30_000, // selective auto-refresh
    refetchOnWindowFocus: true,
  });
  const unread = data?.unread ?? 0;

  return (
    <button type="button" className="relative rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Notifications">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      </svg>
      {unread > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
          {unread > 99 ? '99+' : unread}
        </span>
      )}
    </button>
  );
}
