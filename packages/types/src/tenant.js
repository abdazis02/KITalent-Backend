"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TENANT_STATUSES = exports.SUBSCRIPTION_PLANS = exports.TENANT_MODES = void 0;
/**
 * Product mode of a tenant. PRD §0.1: only two product modes exist;
 * `hybrid` means a tenant has enabled both module sets via its plan.
 */
exports.TENANT_MODES = ['outsourcing', 'saas_hris', 'hybrid'];
/** PRD §7.5 subscription tiers. Limits/feature-flags are resolved per plan. */
exports.SUBSCRIPTION_PLANS = ['starter', 'professional', 'enterprise', 'custom'];
exports.TENANT_STATUSES = ['trial', 'active', 'past_due', 'suspended', 'inactive'];
