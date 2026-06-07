/**
 * Product mode of a tenant. PRD §0.1: only two product modes exist;
 * `hybrid` means a tenant has enabled both module sets via its plan.
 */
export declare const TENANT_MODES: readonly ["outsourcing", "saas_hris", "hybrid"];
export type TenantMode = (typeof TENANT_MODES)[number];
/** PRD §7.5 subscription tiers. Limits/feature-flags are resolved per plan. */
export declare const SUBSCRIPTION_PLANS: readonly ["starter", "professional", "enterprise", "custom"];
export type SubscriptionPlan = (typeof SUBSCRIPTION_PLANS)[number];
export declare const TENANT_STATUSES: readonly ["trial", "active", "past_due", "suspended", "inactive"];
export type TenantStatus = (typeof TENANT_STATUSES)[number];
