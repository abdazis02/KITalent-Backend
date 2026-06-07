/**
 * Translation namespace registry — PRD §10.34 "Translation Namespace Wajib".
 * Every UI string belongs to exactly one namespace. This list is the contract
 * used by the parity checker (scripts/check-parity.mjs) and by app loaders.
 */
export const NAMESPACES = [
  'common',
  'auth',
  'navigation',
  'dashboard',
  'tenant',
  'company',
  'organization',
  'employee',
  'client',
  'outsourcing',
  'recruitment',
  'candidate',
  'contract',
  'placement',
  'schedule',
  'attendance',
  'leave',
  'overtime',
  'payroll',
  'salarySlip',
  'invoice',
  'reimbursement',
  'loan',
  'approval',
  'notification',
  'document',
  'performance',
  'incident',
  'asset',
  'training',
  'report',
  'settings',
  'validation',
  'error',
  'success',
  'emptyState',
] as const;

export type Namespace = (typeof NAMESPACES)[number];
