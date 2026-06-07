import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import type { UpdatePreferenceDto } from './dto/update-preference.dto';

/**
 * Resolves and persists per-user theme/locale (PRD §14 #8-9, §10.34 #8):
 * on login the backend returns the user's last preference; if none, fall back
 * to the tenant default, then to system/default locale.
 */
@Injectable()
export class PreferencesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async get(userId: string, tenantId: string | null) {
    const pref = await this.prisma.userPreference.findUnique({ where: { userId } });
    if (pref) return pref;

    const tenant = tenantId
      ? await this.prisma.tenant.findUnique({ where: { id: tenantId } })
      : null;

    return {
      userId,
      locale: tenant?.defaultLocale ?? this.config.get<string>('i18n.defaultLocale'),
      theme: tenant?.defaultTheme ?? this.config.get<string>('i18n.defaultTheme'),
      timezone: 'Asia/Jakarta',
    };
  }

  async update(userId: string, dto: UpdatePreferenceDto) {
    // `theme` is a Prisma enum; the DTO validated it against THEME_PREFERENCES.
    const data = {
      locale: dto.locale,
      theme: dto.theme as never,
      timezone: dto.timezone,
    };
    return this.prisma.userPreference.upsert({
      where: { userId },
      create: { userId, ...data },
      update: { ...data },
    });
  }
}
