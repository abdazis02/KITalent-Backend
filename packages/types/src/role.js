"use strict";
/**
 * Role keys — PRD §8. Roles are seeded, configurable rows (a role owns a set of
 * permissions). These keys are the stable identifiers used in seeds and guards;
 * display names are resolved via i18n (`role.<key>`), never hardcoded.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROLE_LEVELS = exports.ALL_ROLE_KEYS = exports.COMPANY_ROLES = exports.CLIENT_ROLES = exports.OPERATOR_ROLES = exports.PLATFORM_ROLES = void 0;
/** PRD §8.1 — Platform level. */
exports.PLATFORM_ROLES = [
    'super_admin_platform',
    'platform_owner',
    'platform_support',
    'billing_admin_platform',
    'system_auditor',
];
/** PRD §8.2 — Outsourcing operator level (PT Kamunara Group International). */
exports.OPERATOR_ROLES = [
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
];
/** PRD §8.3 — Client level (outsourcing mode). */
exports.CLIENT_ROLES = [
    'client_owner',
    'client_admin',
    'client_hr',
    'client_finance',
    'client_supervisor',
    'client_approver',
    'client_viewer',
    'client_auditor',
];
/** PRD §8.4 — SaaS HRIS company level. */
exports.COMPANY_ROLES = [
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
];
exports.ALL_ROLE_KEYS = [
    ...exports.PLATFORM_ROLES,
    ...exports.OPERATOR_ROLES,
    ...exports.CLIENT_ROLES,
    ...exports.COMPANY_ROLES,
];
exports.ROLE_LEVELS = ['platform', 'operator', 'client', 'company'];
