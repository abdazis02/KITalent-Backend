/**
 * Role keys — PRD §8. Roles are seeded, configurable rows (a role owns a set of
 * permissions). These keys are the stable identifiers used in seeds and guards;
 * display names are resolved via i18n (`role.<key>`), never hardcoded.
 */

/** PRD §8.1 — Platform level. */
export const PLATFORM_ROLES = [
  'super_admin_platform',
  'platform_owner',
  'platform_support',
  'billing_admin_platform',
  'system_auditor',
] as const;

/** PRD §8.2 — Outsourcing operator level (PT Kamunara Group International). */
export const OPERATOR_ROLES = [
  'outsourcing_owner',
  'operation_manager',
  'hr_manager',
  'hr_admin',
  'recruitment_manager',
  'recruitment_officer',
  'payroll_manager',
  'payroll_officer',
  'finance_manager',
  'finance_officer',
  'legal_officer',
  'area_coordinator',
  'site_supervisor',
  'pic_lapangan',
  'document_admin',
  'report_analyst',
] as const;

/** PRD §8.3 — Client level (outsourcing mode). */
export const CLIENT_ROLES = [
  'client_owner',
  'client_admin',
  'client_hr',
  'client_finance',
  'client_supervisor',
  'client_approver',
  'client_viewer',
  'client_auditor',
] as const;

/** PRD §8.4 — SaaS HRIS company level. */
export const COMPANY_ROLES = [
  'company_owner',
  'company_admin',
  'hr_manager',
  'hr_admin',
  'payroll_manager',
  'payroll_admin',
  'finance_admin',
  'department_head',
  'manager',
  'supervisor',
  'approver',
  'employee',
  'auditor_viewer',
] as const;

export const ALL_ROLE_KEYS = [
  ...PLATFORM_ROLES,
  ...OPERATOR_ROLES,
  ...CLIENT_ROLES,
  ...COMPANY_ROLES,
] as const;

export type RoleKey = (typeof ALL_ROLE_KEYS)[number];

export const ROLE_LEVELS = ['platform', 'operator', 'client', 'company'] as const;
export type RoleLevel = (typeof ROLE_LEVELS)[number];
