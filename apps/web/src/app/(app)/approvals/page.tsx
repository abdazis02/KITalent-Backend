'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/api-client';

interface Step { name: string; status: string }
interface Instance {
  id: string;
  module: string;
  status: string;
  steps: Step[];
  workflow?: { name: string } | null;
}

export default function ApprovalsPage() {
  const tn = useTranslations('navigation');
  const tc = useTranslations('common');
  const qc = useQueryClient();

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['approvals', 'inbox'],
    queryFn: ({ signal }) => api.get<Instance[]>('/approvals/inbox', signal),
  });

  const act = useMutation({
    mutationFn: (v: { id: string; decision: 'approve' | 'reject' }) =>
      api.post(`/approvals/instances/${v.id}/act`, { decision: v.decision }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['approvals', 'inbox'] }),
  });

  const items = data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">{tn('approvals')}</h1>
        <button onClick={() => refetch()} disabled={isFetching} className="h-9 rounded-md border border-border bg-background px-3 text-sm font-medium hover:bg-muted disabled:opacity-50">
          {tc('refresh')}
        </button>
      </div>

      {isLoading ? (
        <div className="rounded-lg border border-border bg-card p-10 text-center text-muted-foreground">{tc('loading')}</div>
      ) : isError ? (
        <div className="rounded-lg border border-border bg-card p-10 text-center text-destructive">Error</div>
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-10 text-center text-muted-foreground">{tc('noData')}</div>
      ) : (
        <div className="grid gap-3">
          {items.map((inst) => {
            const current = inst.steps?.find((s) => s.status === 'pending');
            return (
              <div key={inst.id} className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold uppercase text-foreground">{inst.module}</div>
                    <div className="text-sm text-muted-foreground">{inst.workflow?.name ?? '—'} · {current?.name ?? '—'}</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => act.mutate({ id: inst.id, decision: 'reject' })} disabled={act.isPending} className="h-9 rounded-md border border-border px-3 text-sm font-medium text-destructive hover:bg-muted disabled:opacity-50">
                      {tc('reject')}
                    </button>
                    <button onClick={() => act.mutate({ id: inst.id, decision: 'approve' })} disabled={act.isPending} className="h-9 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50">
                      {tc('approve')}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
