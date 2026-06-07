import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../../prisma/prisma.service';
import type { AuthenticatedUser } from '../../../common/decorators/current-user.decorator';

interface JwtPayload {
  sub: string;
  tenantId: string | null;
  email: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('jwt.accessSecret')!,
    });
  }

  /**
   * Resolves the user's effective roles + permissions on every request so RBAC
   * decisions reflect current grants (PRD §9). For high-traffic deployments this
   * lookup is a natural Redis cache point.
   */
  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findFirst({
      where: { id: payload.sub, deletedAt: null, isActive: true },
      include: {
        userRoles: {
          include: {
            role: { include: { rolePermissions: { include: { permission: true } } } },
          },
        },
      },
    });
    if (!user) throw new UnauthorizedException();

    const roles = user.userRoles.map((ur) => ur.role.key);
    const permissions = [
      ...new Set(
        user.userRoles.flatMap((ur) => ur.role.rolePermissions.map((rp) => rp.permission.key)),
      ),
    ];

    return {
      id: user.id,
      tenantId: user.tenantId,
      email: user.email,
      roles,
      permissions,
    };
  }
}
