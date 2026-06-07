/**
 * Product mode of a tenant. PRD §0.1: only two product modes exist;
 * `hybrid` means a tenant has enabled both module sets via its plan.
 */
export const TENANT_MODES = ['outsourcing', 'saas_hris', 'hybrid'] as const;
export type TenantMode = (typeof TENANT_MODES)[number];

/** PRD §7.5 subscription tiers. Limits/feature-flags are resolved per plan. */
export const SUBSCRIPTION_PLANS = ['starter', 'professional', 'enterprise', 'custom'] as const;
export type SubscriptionPlan = (typeof SUBSCRIPTION_PLANS)[number];

export const TENANT_STATUSES = ['trial', 'active', 'past_due', 'suspended', 'inactive'] as const;
export type TenantStatus = (typeof TENANT_STATUSES)[number];
