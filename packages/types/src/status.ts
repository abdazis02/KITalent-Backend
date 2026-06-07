/**
 * Domain status enums — PRD §10. Kept as `const` tuples so they can drive both
 * TypeScript types and runtime validation, and so labels resolve via i18n
 * (`status.<domain>.<value>`) instead of being hardcoded.
 */

// PRD §10.5
export const EMPLOYEE_STATUSES = [
  'draft',
  'candidate',
  'onboarding',
  'active',
  'probation',
  'suspended',
  'resigned',
  'terminated',
  'blacklisted',
] as const;
export type EmployeeStatus = (typeof EMPLOYEE_STATUSES)[number];

// PRD §10.8
export const MANPOWER_REQUEST_STATUSES = [
  'draft',
  'submitted',
  'client_approved',
  'operator_reviewed',
  'need_revision',
  'in_recruitment',
  'partially_fulfilled',
  'fulfilled',
  'cancelled',
  'rejected',
  'closed',
] as const;
export type ManpowerRequestStatus = (typeof MANPOWER_REQUEST_STATUSES)[number];

// PRD §10.9
export const RECRUITMENT_STAGES = [
  'applied',
  'screening',
  'shortlisted',
  'interview_scheduled',
  'interviewed',
  'assessment',
  'mcu',
  'background_check',
  'offering',
  'accepted',
  'rejected',
  'onboarding',
  'hired',
] as const;
export type RecruitmentStage = (typeof RECRUITMENT_STAGES)[number];

// PRD §10.10
export const CONTRACT_STATUSES = [
  'draft',
  'waiting_approval',
  'approved',
  'sent',
  'signed',
  'active',
  'expiring_soon',
  'expired',
  'renewed',
  'terminated',
  'cancelled',
] as const;
export type ContractStatus = (typeof CONTRACT_STATUSES)[number];

// PRD §10.10 — contract kinds
export const CONTRACT_TYPES = [
  'pkwt',
  'pkwtt',
  'client_agreement',
  'addendum',
  'placement_letter',
  'nda',
  'offering_letter',
] as const;
export type ContractType = (typeof CONTRACT_TYPES)[number];

// PRD §10.11
export const PLACEMENT_STATUSES = [
  'draft',
  'waiting_approval',
  'active',
  'on_hold',
  'replacement_requested',
  'replaced',
  'completed',
  'cancelled',
] as const;
export type PlacementStatus = (typeof PLACEMENT_STATUSES)[number];

// PRD §10.13
export const ATTENDANCE_STATUSES = [
  'present',
  'late',
  'early_leave',
  'absent',
  'leave',
  'permission',
  'sick',
  'holiday',
  'day_off',
  'overtime',
  'pending_correction',
  'corrected',
  'rejected',
] as const;
export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

// PRD §10.17
export const PAYROLL_STATUSES = [
  'draft',
  'calculating',
  'need_review',
  'waiting_approval',
  'approved',
  'paid',
  'locked',
  'cancelled',
] as const;
export type PayrollStatus = (typeof PAYROLL_STATUSES)[number];

// PRD §10.17
export const PAYROLL_COMPONENT_TYPES = [
  'earning',
  'deduction',
  'benefit',
  'tax',
  'employer_contribution',
  'employee_contribution',
  'reimbursement',
  'loan',
  'adjustment',
] as const;
export type PayrollComponentType = (typeof PAYROLL_COMPONENT_TYPES)[number];

// PRD §10.21
export const INVOICE_STATUSES = [
  'draft',
  'waiting_approval',
  'approved',
  'sent',
  'partially_paid',
  'paid',
  'overdue',
  'cancelled',
  'void',
] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

// PRD §10.21 — invoice line item kinds
export const INVOICE_ITEM_TYPES = [
  'service',
  'payroll',
  'management_fee',
  'penalty',
  'additional',
  'discount',
] as const;
export type InvoiceItemType = (typeof INVOICE_ITEM_TYPES)[number];

// PRD §10.15 / §10.19 — shared request approval lifecycle
export const REQUEST_STATUSES = [
  'draft',
  'submitted',
  'waiting_approval',
  'approved',
  'rejected',
  'need_revision',
  'paid',
  'cancelled',
] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];

// PRD §10.22
export const PERFORMANCE_STATUSES = [
  'draft',
  'in_review',
  'submitted',
  'approved',
  'published',
  'archived',
] as const;
export type PerformanceStatus = (typeof PERFORMANCE_STATUSES)[number];
