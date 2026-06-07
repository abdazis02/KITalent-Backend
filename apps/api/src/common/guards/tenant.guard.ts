import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import type { AuthenticatedUser } from '../decorators/current-user.decorator';

/**
 * Tenant isolation guard (PRD §0.3, §10.1). Resolves the active tenant for the
 * request and rejects any attempt to act on a different tenant.
 *
 * Tenant is taken from the JWT (`user.tenantId`). Platform-level users (no
 * tenantId) may target a specific tenant via the `x-tenant-id` header; everyone
 * else is pinned to their own tenant. The resolved id is attached as
 * `request.tenantId` for downstream services to scope queries.
 */
@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUser | undefined;
    if (!user) throw new ForbiddenException('Missing authenticated user');

    const headerTenant = request.headers['x-tenant-id'] as string | undefined;

    if (user.tenantId) {
      // Tenant-bound user: ignore/forbid mismatching header.
      if (headerTenant && headerTenant !== user.tenantId) {
        throw new ForbiddenException('Cross-tenant access denied');
      }
      request.tenantId = user.tenantId;
    } else {
      // Platform user: may scope into a tenant via header.
      request.tenantId = headerTenant ?? null;
    }
    return true;
  }
}
