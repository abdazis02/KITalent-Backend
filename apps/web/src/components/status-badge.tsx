'use client';

/** Shared status pill used across admin list pages. */
export function StatusBadge({ value }: { value: string }) {
  const tone = TONES[value] ?? 'bg-muted text-muted-foreground';
  return <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${tone}`}>{value}</span>;
}

const TONES: Record<string, string> = {
  active: 'bg-success/15 text-success',
  approved: 'bg-success/15 text-success',
  paid: 'bg-success/15 text-success',
  published: 'bg-success/15 text-success',
  signed: 'bg-success/15 text-success',
  client_approved: 'bg-success/15 text-success',
  fulfilled: 'bg-success/15 text-success',
  completed: 'bg-success/15 text-success',
  rejected: 'bg-destructive/15 text-destructive',
  cancelled: 'bg-destructive/15 text-destructive',
  terminated: 'bg-destructive/15 text-destructive',
  expired: 'bg-destructive/15 text-destructive',
  blacklisted: 'bg-destructive/15 text-destructive',
  draft: 'bg-muted text-muted-foreground',
  submitted: 'bg-warning/15 text-warning',
  waiting_approval: 'bg-warning/15 text-warning',
  pending: 'bg-warning/15 text-warning',
  need_review: 'bg-warning/15 text-warning',
  in_recruitment: 'bg-info/15 text-info',
  sent: 'bg-info/15 text-info',
  probation: 'bg-info/15 text-info',
};
