/**
 * Domain status enums — PRD §10. Kept as `const` tuples so they can drive both
 * TypeScript types and runtime validation, and so labels resolve via i18n
 * (`status.<domain>.<value>`) instead of being hardcoded.
 */
export declare const EMPLOYEE_STATUSES: readonly ["draft", "candidate", "onboarding", "active", "probation", "suspended", "resigned", "terminated", "blacklisted"];
export type EmployeeStatus = (typeof EMPLOYEE_STATUSES)[number];
export declare const MANPOWER_REQUEST_STATUSES: readonly ["draft", "submitted", "client_approved", "operator_reviewed", "need_revision", "in_recruitment", "partially_fulfilled", "fulfilled", "cancelled", "rejected", "closed"];
export type ManpowerRequestStatus = (typeof MANPOWER_REQUEST_STATUSES)[number];
export declare const RECRUITMENT_STAGES: readonly ["applied", "screening", "shortlisted", "interview_scheduled", "interviewed", "assessment", "mcu", "background_check", "offering", "accepted", "rejected", "onboarding", "hired"];
export type RecruitmentStage = (typeof RECRUITMENT_STAGES)[number];
export declare const CONTRACT_STATUSES: readonly ["draft", "waiting_approval", "approved", "sent", "signed", "active", "expiring_soon", "expired", "renewed", "terminated", "cancelled"];
export type ContractStatus = (typeof CONTRACT_STATUSES)[number];
export declare const PLACEMENT_STATUSES: readonly ["draft", "waiting_approval", "active", "on_hold", "replacement_requested", "replaced", "completed", "cancelled"];
export type PlacementStatus = (typeof PLACEMENT_STATUSES)[number];
export declare const ATTENDANCE_STATUSES: readonly ["present", "late", "early_leave", "absent", "leave", "permission", "sick", "holiday", "day_off", "overtime", "pending_correction", "corrected", "rejected"];
export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];
export declare const PAYROLL_STATUSES: readonly ["draft", "calculating", "need_review", "waiting_approval", "approved", "paid", "locked", "cancelled"];
export type PayrollStatus = (typeof PAYROLL_STATUSES)[number];
export declare const PAYROLL_COMPONENT_TYPES: readonly ["earning", "deduction", "benefit", "tax", "employer_contribution", "employee_contribution", "reimbursement", "loan", "adjustment"];
export type PayrollComponentType = (typeof PAYROLL_COMPONENT_TYPES)[number];
export declare const INVOICE_STATUSES: readonly ["draft", "waiting_approval", "approved", "sent", "partially_paid", "paid", "overdue", "cancelled", "void"];
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];
export declare const REQUEST_STATUSES: readonly ["draft", "submitted", "waiting_approval", "approved", "rejected", "need_revision", "paid", "cancelled"];
export type RequestStatus = (typeof REQUEST_STATUSES)[number];
export declare const PERFORMANCE_STATUSES: readonly ["draft", "in_review", "submitted", "approved", "published", "archived"];
export type PerformanceStatus = (typeof PERFORMANCE_STATUSES)[number];
