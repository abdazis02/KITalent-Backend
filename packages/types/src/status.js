"use strict";
/**
 * Domain status enums — PRD §10. Kept as `const` tuples so they can drive both
 * TypeScript types and runtime validation, and so labels resolve via i18n
 * (`status.<domain>.<value>`) instead of being hardcoded.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PERFORMANCE_STATUSES = exports.REQUEST_STATUSES = exports.INVOICE_STATUSES = exports.PAYROLL_COMPONENT_TYPES = exports.PAYROLL_STATUSES = exports.ATTENDANCE_STATUSES = exports.PLACEMENT_STATUSES = exports.CONTRACT_STATUSES = exports.RECRUITMENT_STAGES = exports.MANPOWER_REQUEST_STATUSES = exports.EMPLOYEE_STATUSES = void 0;
// PRD §10.5
exports.EMPLOYEE_STATUSES = [
    'draft',
    'candidate',
    'onboarding',
    'active',
    'probation',
    'suspended',
    'resigned',
    'terminated',
    'blacklisted',
];
// PRD §10.8
exports.MANPOWER_REQUEST_STATUSES = [
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
];
// PRD §10.9
exports.RECRUITMENT_STAGES = [
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
];
// PRD §10.10
exports.CONTRACT_STATUSES = [
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
];
// PRD §10.11
exports.PLACEMENT_STATUSES = [
    'draft',
    'waiting_approval',
    'active',
    'on_hold',
    'replacement_requested',
    'replaced',
    'completed',
    'cancelled',
];
// PRD §10.13
exports.ATTENDANCE_STATUSES = [
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
];
// PRD §10.17
exports.PAYROLL_STATUSES = [
    'draft',
    'calculating',
    'need_review',
    'waiting_approval',
    'approved',
    'paid',
    'locked',
    'cancelled',
];
// PRD §10.17
exports.PAYROLL_COMPONENT_TYPES = [
    'earning',
    'deduction',
    'benefit',
    'tax',
    'employer_contribution',
    'employee_contribution',
    'reimbursement',
    'loan',
    'adjustment',
];
// PRD §10.21
exports.INVOICE_STATUSES = [
    'draft',
    'waiting_approval',
    'approved',
    'sent',
    'partially_paid',
    'paid',
    'overdue',
    'cancelled',
    'void',
];
// PRD §10.15 / §10.19 — shared request approval lifecycle
exports.REQUEST_STATUSES = [
    'draft',
    'submitted',
    'waiting_approval',
    'approved',
    'rejected',
    'need_revision',
    'paid',
    'cancelled',
];
// PRD §10.22
exports.PERFORMANCE_STATUSES = [
    'draft',
    'in_review',
    'submitted',
    'approved',
    'published',
    'archived',
];
