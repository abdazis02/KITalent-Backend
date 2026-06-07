"use strict";
/**
 * RBAC permission grammar — PRD §9.
 *
 *   module.action.scope        e.g. "payroll.approve.tenant", "attendance.create.own"
 *
 * Permissions are configurable data (seeded, not hardcoded into guards). These
 * constants define the *vocabulary* the system validates against.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PERMISSION_PATTERN = exports.PERMISSION_MODULES = exports.PERMISSION_SCOPES = exports.PERMISSION_ACTIONS = void 0;
exports.buildPermission = buildPermission;
exports.parsePermission = parsePermission;
exports.isValidPermission = isValidPermission;
/** PRD §9.2 — standard actions. */
exports.PERMISSION_ACTIONS = [
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
];
/** PRD §9.3 — standard scopes, ordered widest-last. */
exports.PERMISSION_SCOPES = [
    'own',
    'team',
    'department',
    'branch',
    'location',
    'client',
    'company',
    'tenant',
    'all',
];
/**
 * Module keys. Mirrors PRD §6 / §10 module list. Kept as a flat registry so
 * permission strings stay stable for linting, QA, and seed validation.
 */
exports.PERMISSION_MODULES = [
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
];
exports.PERMISSION_PATTERN = /^[a-zA-Z][a-zA-Z0-9]*\.[a-z]+\.[a-z]+$/;
function buildPermission(module, action, scope) {
    return `${module}.${action}.${scope}`;
}
function parsePermission(permission) {
    const parts = permission.split('.');
    if (parts.length !== 3)
        return null;
    const [module, action, scope] = parts;
    return { module, action, scope };
}
function isValidPermission(permission) {
    return exports.PERMISSION_PATTERN.test(permission);
}
