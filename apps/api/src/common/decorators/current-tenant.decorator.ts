import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

/**
 * Injects the resolved active tenant id (set by TenantGuard). Returns null for
 * platform-level users acting without a tenant scope.
 */
export const CurrentTenant = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | null => {
    return ctx.switchToHttp().getRequest().tenantId ?? null;
  },
);
