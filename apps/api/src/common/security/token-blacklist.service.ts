import { Injectable } from '@nestjs/common';

/**
 * Access-token denylist for logout (PRD §22). Refresh tokens are already revoked
 * in the DB; this invalidates the short-lived ACCESS token (by its jti) before it
 * naturally expires.
 *
 * In-memory by design — single-process. For horizontal scaling, back this with
 * Redis (SET jti EX <ttl>); the interface stays the same.
 */
@Injectable()
export class TokenBlacklistService {
  /** jti -> epoch-ms expiry. */
  private readonly blocked = new Map<string, number>();

  /** Block a token id until `ttlSeconds` from now (no-op if ttl <= 0). */
  block(jti: string | undefined | null, ttlSeconds: number): void {
    if (!jti || ttlSeconds <= 0) return;
    this.prune();
    this.blocked.set(jti, Date.now() + ttlSeconds * 1000);
  }

  isBlocked(jti: string | undefined | null): boolean {
    if (!jti) return false;
    const expiry = this.blocked.get(jti);
    if (expiry === undefined) return false;
    if (expiry <= Date.now()) {
      this.blocked.delete(jti);
      return false;
    }
    return true;
  }

  /** Drop expired entries so the map doesn't grow unbounded. */
  private prune(): void {
    const now = Date.now();
    for (const [jti, exp] of this.blocked) if (exp <= now) this.blocked.delete(jti);
  }
}
