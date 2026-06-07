'use client';

import { useLocale } from 'next-intl';

/** Shared status pill with bilingual labels (id-ID / en-US). */
export function StatusBadge({ value }: { value: string }) {
  const locale = useLocale();
  const tone = TONES[value] ?? 'bg-muted text-muted-foreground';
  const label = LABELS[value]?.[locale === 'id-ID' ? 0 : 1] ?? value.replace(/_/g, ' ');
  return <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize ${tone}`}>{label}</span>;
}

// [id, en]
const LABELS: Record<string, [string, string]> = {
  draft: ['Draf', 'Draft'],
  submitted: ['Diajukan', 'Submitted'],
  waiting_approval: ['Menunggu Persetujuan', 'Waiting Approval'],
  approved: ['Disetujui', 'Approved'],
  rejected: ['Ditolak', 'Rejected'],
  sent: ['Terkirim', 'Sent'],
  signed: ['Ditandatangani', 'Signed'],
  active: ['Aktif', 'Active'],
  inactive: ['Nonaktif', 'Inactive'],
  expired: ['Kedaluwarsa', 'Expired'],
  expiring_soon: ['Akan Berakhir', 'Expiring Soon'],
  terminated: ['Diakhiri', 'Terminated'],
  renewed: ['Diperpanjang', 'Renewed'],
  cancelled: ['Dibatalkan', 'Cancelled'],
  paid: ['Lunas', 'Paid'],
  partially_paid: ['Sebagian Dibayar', 'Partially Paid'],
  overdue: ['Jatuh Tempo', 'Overdue'],
  published: ['Dipublikasi', 'Published'],
  pending: ['Menunggu', 'Pending'],
  need_review: ['Perlu Tinjauan', 'Need Review'],
  locked: ['Terkunci', 'Locked'],
  client_approved: ['Disetujui Klien', 'Client Approved'],
  operator_reviewed: ['Ditinjau Operator', 'Operator Reviewed'],
  in_recruitment: ['Dalam Rekrutmen', 'In Recruitment'],
  partially_fulfilled: ['Terpenuhi Sebagian', 'Partially Fulfilled'],
  fulfilled: ['Terpenuhi', 'Fulfilled'],
  closed: ['Ditutup', 'Closed'],
  completed: ['Selesai', 'Completed'],
  on_hold: ['Ditahan', 'On Hold'],
  replacement_requested: ['Minta Pengganti', 'Replacement Requested'],
  replaced: ['Diganti', 'Replaced'],
  probation: ['Percobaan', 'Probation'],
  resigned: ['Mengundurkan Diri', 'Resigned'],
  blacklisted: ['Daftar Hitam', 'Blacklisted'],
  onboarding: ['Onboarding', 'Onboarding'],
  trial: ['Uji Coba', 'Trial'],
  open: ['Terbuka', 'Open'],
  reported: ['Dilaporkan', 'Reported'],
  available: ['Tersedia', 'Available'],
  planned: ['Direncanakan', 'Planned'],
};

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
  overdue: 'bg-destructive/15 text-destructive',
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
