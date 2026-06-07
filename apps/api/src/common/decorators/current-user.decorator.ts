import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

export interface AuthenticatedUser {
  id: string;
  tenantId: string | null;
  email: string;
  roles: string[];
  permissions: string[];
  /** Access-token id + expiry (epoch seconds) — used for the logout denylist (PRD §22). */
  jti?: string;
  tokenExp?: number;
}

/** Injects the authenticated user (populated by JwtAuthGuard) into a handler. */
export const CurrentUser = createParamDecorator(
  (data: keyof AuthenticatedUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUser | undefined;
    return data && user ? user[data] : user;
  },
);
