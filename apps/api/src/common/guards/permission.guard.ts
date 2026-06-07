import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import type { AuthenticatedUser } from '../decorators/current-user.decorator';

/**
 * RBAC guard (PRD §9). Compares the route's @RequirePermissions() list against
 * the user's effective permissions. A user permission with `.all` scope (or a
 * wider scope than required) satisfies a narrower requirement of the same
 * module.action.
 */
@Injectable()
export class PermissionGuard implements CanActivate {
  // Widest-last; an index further right satisfies anything to its left.
  private static readonly SCOPE_ORDER = [
    'own',
    'team',
    'department',
    'branch',
    'location',
    'client',
    'company',
    'tenant',
    'all',
  ];

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const user = context.switchToHttp().getRequest().user as AuthenticatedUser | undefined;
    if (!user) throw new ForbiddenException('Missing authenticated user');

    const held = new Set(user.permissions ?? []);
    const ok = required.every((req) => this.satisfies(held, req));
    if (!ok) throw new ForbiddenException('Insufficient permissions');
    return true;
  }

  private satisfies(held: Set<string>, required: string): boolean {
    if (held.has(required)) return true;
    const [reqModule, reqAction, reqScope] = required.split('.');
    const reqRank = PermissionGuard.SCOPE_ORDER.indexOf(reqScope);
    for (const p of held) {
      const [m, a, s] = p.split('.');
      if (m !== reqModule || a !== reqAction) continue;
      if (PermissionGuard.SCOPE_ORDER.indexOf(s) >= reqRank) return true;
    }
    return false;
  }
}
