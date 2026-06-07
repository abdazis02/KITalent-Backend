/**
 * RBAC permission grammar — PRD §9.
 *
 *   module.action.scope        e.g. "payroll.approve.tenant", "attendance.create.own"
 *
 * Permissions are configurable data (seeded, not hardcoded into guards). These
 * constants define the *vocabulary* the system validates against.
 */

/** PRD §9.2 — standard actions. */
export const PERMISSION_ACTIONS = [
  'create',
  'read',
  'update',
  'delete',
  'restore',
  'approve',
  'reject',
  'export',
  'import',
  'assign',
  'archive',
  'download',
  'upload',
  'generate',
  'process',
  'sync',
] as const;
export type PermissionAction = (typeof PERMISSION_ACTIONS)[number];

/** PRD §9.3 — standard scopes, ordered widest-last. */
export const PERMISSION_SCOPES = [
  'own',
  'team',
  'department',
  'branch',
  'location',
  'client',
  'company',
  'tenant',
  'all',
] as const;
export type PermissionScope = (typeof PERMISSION_SCOPES)[number];

/**
 * Module keys. Mirrors PRD §6 / §10 module list. Kept as a flat registry so
 * permission strings stay stable for linting, QA, and seed validation.
 */
export const PERMISSION_MODULES = [
  'tenant',
  'subscription',
  'company',
  'organization',
  'employee',
  'client',
  'service',
  'manpowerRequest',
  'recruitment',
  'candidate',
  'contract',
  'placement',
  'shift',
  'schedule',
  'attendance',
  'fingerprint',
  'leave',
  'permission',
  'overtime',
  'payroll',
  'salarySlip',
  'reimbursement',
  'loan',
  'invoice',
  'performance',
  'incident',
  'asset',
  'training',
  'document',
  'approval',
  'notification',
  'report',
  'audit',
  'settings',
  'user',
  'role',
] as const;
export type PermissionModule = (typeof PERMISSION_MODULES)[number];

export type Permission = `${string}.${PermissionAction}.${PermissionScope}`;

export const PERMISSION_PATTERN =
  /^[a-zA-Z][a-zA-Z0-9]*\.[a-z]+\.[a-z]+$/;

export function buildPermission(
  module: PermissionModule,
  action: PermissionAction,
  scope: PermissionScope,
): Permission {
  return `${module}.${action}.${scope}`;
}

export function parsePermission(permission: string):
  | { module: string; action: string; scope: string }
  | null {
  const parts = permission.split('.');
  if (parts.length !== 3) return null;
  const [module, action, scope] = parts;
  return { module, action, scope };
}

export function isValidPermission(permission: string): boolean {
  return PERMISSION_PATTERN.test(permission);
}
