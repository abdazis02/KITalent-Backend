/**
 * Role keys — PRD §8. Roles are seeded, configurable rows (a role owns a set of
 * permissions). These keys are the stable identifiers used in seeds and guards;
 * display names are resolved via i18n (`role.<key>`), never hardcoded.
 */
/** PRD §8.1 — Platform level. */
export declare const PLATFORM_ROLES: readonly ["super_admin_platform", "platform_owner", "platform_support", "billing_admin_platform", "system_auditor"];
/** PRD §8.2 — Outsourcing operator level (PT Kamunara Group International). */
export declare const OPERATOR_ROLES: readonly ["outsourcing_owner", "operation_manager", "hr_manager", "hr_admin", "recruitment_manager", "recruitment_officer", "payroll_manager", "payroll_officer", "finance_manager", "finance_officer", "legal_officer", "area_coordinator", "site_supervisor", "pic_lapangan", "document_admin", "report_analyst"];
/** PRD §8.3 — Client level (outsourcing mode). */
export declare const CLIENT_ROLES: readonly ["client_owner", "client_admin", "client_hr", "client_finance", "client_supervisor", "client_approver", "client_viewer", "client_auditor"];
/** PRD §8.4 — SaaS HRIS company level. */
export declare const COMPANY_ROLES: readonly ["company_owner", "company_admin", "hr_manager", "hr_admin", "payroll_manager", "payroll_admin", "finance_admin", "department_head", "manager", "supervisor", "approver", "employee", "auditor_viewer"];
export declare const ALL_ROLE_KEYS: readonly ["super_admin_platform", "platform_owner", "platform_support", "billing_admin_platform", "system_auditor", "outsourcing_owner", "operation_manager", "hr_manager", "hr_admin", "recruitment_manager", "recruitment_officer", "payroll_manager", "payroll_officer", "finance_manager", "finance_officer", "legal_officer", "area_coordinator", "site_supervisor", "pic_lapangan", "document_admin", "report_analyst", "client_owner", "client_admin", "client_hr", "client_finance", "client_supervisor", "client_approver", "client_viewer", "client_auditor", "company_owner", "company_admin", "hr_manager", "hr_admin", "payroll_manager", "payroll_admin", "finance_admin", "department_head", "manager", "supervisor", "approver", "employee", "auditor_viewer"];
export type RoleKey = (typeof ALL_ROLE_KEYS)[number];
export declare const ROLE_LEVELS: readonly ["platform", "operator", "client", "company"];
export type RoleLevel = (typeof ROLE_LEVELS)[number];
