import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { randomBytes, createHash } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import type { LoginDto } from './dto/login.dto';

interface RequestContext {
  ipAddress?: string;
  userAgent?: string;
  deviceId?: string;
}

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly audit: AuditService,
  ) {}

  static hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  async login(dto: LoginDto, ctx: RequestContext) {
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email, tenantId: dto.tenantId ?? null, deletedAt: null },
    });

    if (!user) throw new UnauthorizedException('Invalid email or password');

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedException('Account locked due to too many failed attempts');
    }

    const valid = await argon2.verify(user.passwordHash, dto.password).catch(() => false);
    if (!valid) {
      await this.registerFailedAttempt(user.id, user.failedLoginAttempts);
      await this.recordLogin(user.id, user.tenantId, ctx, 'failed', 'Invalid password');
      throw new UnauthorizedException('Invalid email or password');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
    });

    const tokens = await this.issueTokens(user.id, user.tenantId, user.email, ctx);

    await this.audit.record({
      tenantId: user.tenantId,
      actorId: user.id,
      action: 'auth.login',
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });
    await this.recordLogin(user.id, user.tenantId, ctx, 'success');

    return tokens;
  }

  /** PRD §17.3 login_histories — record every login attempt. */
  private async recordLogin(userId: string, tenantId: string | null, ctx: RequestContext, status: 'success' | 'failed', failureReason?: string) {
    try {
      await this.prisma.loginHistory.create({ data: { userId, tenantId, ipAddress: ctx.ipAddress, userAgent: ctx.userAgent, deviceId: ctx.deviceId, status, failureReason } });
    } catch {
      /* never block login on history write */
    }
  }

  /** Refresh-token rotation (PRD §10.1): old token is revoked, a new one issued. */
  async refresh(refreshToken: string, ctx: RequestContext) {
    let payload: { sub: string; tenantId: string | null; email: string };
    try {
      payload = await this.jwt.verifyAsync(refreshToken, {
        secret: this.config.get<string>('jwt.refreshSecret'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokenHash = AuthService.hashToken(refreshToken);
    const stored = await this.prisma.refreshToken.findFirst({
      where: { userId: payload.sub, tokenHash, revokedAt: null, expiresAt: { gt: new Date() } },
    });
    if (!stored) throw new UnauthorizedException('Refresh token has been revoked or expired');

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    return this.issueTokens(payload.sub, payload.tenantId, payload.email, ctx);
  }

  async logout(userId: string, refreshToken: string | undefined, tenantId: string | null) {
    if (refreshToken) {
      await this.prisma.refreshToken.updateMany({
        where: { userId, tokenHash: AuthService.hashToken(refreshToken), revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    await this.audit.record({ tenantId, actorId: userId, action: 'auth.logout' });
  }

  private async issueTokens(
    userId: string,
    tenantId: string | null,
    email: string,
    ctx: RequestContext,
  ) {
    const payload = { sub: userId, tenantId, email };
    const accessTtl = this.config.get<number>('jwt.accessTtl')!;
    const refreshTtl = this.config.get<number>('jwt.refreshTtl')!;

    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.config.get<string>('jwt.accessSecret'),
      expiresIn: accessTtl,
    });
    // Add jitter so two tokens minted in the same second differ.
    const refreshToken = await this.jwt.signAsync(
      { ...payload, jti: randomBytes(16).toString('hex') },
      { secret: this.config.get<string>('jwt.refreshSecret'), expiresIn: refreshTtl },
    );

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: AuthService.hashToken(refreshToken),
        deviceId: ctx.deviceId,
        userAgent: ctx.userAgent,
        ipAddress: ctx.ipAddress,
        expiresAt: new Date(Date.now() + refreshTtl * 1000),
      },
    });

    return { accessToken, refreshToken, tokenType: 'Bearer', expiresIn: accessTtl };
  }

  private async registerFailedAttempt(userId: string, current: number) {
    const attempts = current + 1;
    const lock = attempts >= MAX_FAILED_ATTEMPTS;
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: lock ? 0 : attempts,
        lockedUntil: lock ? new Date(Date.now() + LOCK_MINUTES * 60_000) : undefined,
      },
    });
  }
}
