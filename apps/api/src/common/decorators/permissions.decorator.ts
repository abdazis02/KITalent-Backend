import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Declares the permission(s) required for a route, in `module.action.scope`
 * form (PRD §9). The PermissionGuard checks the authenticated user's effective
 * permission set against these. Multiple = user must hold ALL.
 *
 * @example @RequirePermissions('payroll.approve.tenant')
 */
export const RequirePermissions = (...permissions: string[]): MethodDecorator & ClassDecorator =>
  SetMetadata(PERMISSIONS_KEY, permissions);
