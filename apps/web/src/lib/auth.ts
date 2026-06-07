'use client';

/**
 * Minimal client-side token store. Access/refresh tokens live in localStorage;
 * the active tenant id is sent as `x-tenant-id` (harmless for tenant-bound
 * users, required for platform users acting into a tenant).
 */
const ACCESS = 'kitalent.accessToken';
const REFRESH = 'kitalent.refreshToken';
const TENANT = 'kitalent.tenantId';

export interface Session {
  accessToken: string;
  refreshToken: string;
  tenantId: string | null;
}

export const auth = {
  get accessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(ACCESS);
  },
  get refreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(REFRESH);
  },
  get tenantId(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TENANT);
  },
  set(session: Session): void {
    localStorage.setItem(ACCESS, session.accessToken);
    localStorage.setItem(REFRESH, session.refreshToken);
    if (session.tenantId) localStorage.setItem(TENANT, session.tenantId);
  },
  setAccess(accessToken: string): void {
    localStorage.setItem(ACCESS, accessToken);
  },
  clear(): void {
    localStorage.removeItem(ACCESS);
    localStorage.removeItem(REFRESH);
    localStorage.removeItem(TENANT);
  },
  get isAuthenticated(): boolean {
    return !!this.accessToken;
  },
};
