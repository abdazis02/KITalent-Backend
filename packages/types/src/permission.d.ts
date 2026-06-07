/**
 * RBAC permission grammar — PRD §9.
 *
 *   module.action.scope        e.g. "payroll.approve.tenant", "attendance.create.own"
 *
 * Permissions are configurable data (seeded, not hardcoded into guards). These
 * constants define the *vocabulary* the system validates against.
 */
/** PRD §9.2 — standard actions. */
export declare const PERMISSION_ACTIONS: readonly ["create", "read", "update", "delete", "restore", "approve", "reject", "export", "import", "assign", "archive", "download", "upload", "generate", "process", "sync"];
export type PermissionAction = (typeof PERMISSION_ACTIONS)[number];
/** PRD §9.3 — standard scopes, ordered widest-last. */
export declare const PERMISSION_SCOPES: readonly ["own", "team", "department", "branch", "location", "client", "company", "tenant", "all"];
export type PermissionScope = (typeof PERMISSION_SCOPES)[number];
/**
 * Module keys. Mirrors PRD §6 / §10 module list. Kept as a flat registry so
 * permission strings stay stable for linting, QA, and seed validation.
 */
export declare const PERMISSION_MODULES: readonly ["tenant", "subscription", "company", "organization", "employee", "client", "service", "manpowerRequest", "recruitment", "candidate", "contract", "placement", "shift", "schedule", "attendance", "fingerprint", "leave", "permission", "overtime", "payroll", "salarySlip", "reimbursement", "loan", "invoice", "performance", "incident", "asset", "training", "document", "approval", "notification", "report", "audit", "settings", "user", "role"];
export type PermissionModule = (typeof PERMISSION_MODULES)[number];
export type Permission = `${string}.${PermissionAction}.${PermissionScope}`;
export declare const PERMISSION_PATTERN: RegExp;
export declare function buildPermission(module: PermissionModule, action: PermissionAction, scope: PermissionScope): Permission;
export declare function parsePermission(permission: string): {
    module: string;
    action: string;
    scope: string;
} | null;
export declare function isValidPermission(permission: string): boolean;
