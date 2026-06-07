import { Module } from '@nestjs/common';
import { Body, Controller, ForbiddenException, Get, Headers, Injectable, NotFoundException, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiProperty, ApiPropertyOptional, ApiQuery, ApiTags } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser, type AuthenticatedUser } from '../../common/decorators/current-user.decorator';

const LOCALES = ['id-ID', 'en-US'];

class KeyDto { @ApiProperty({ example: 'common' }) @IsString() namespace!: string; @ApiProperty({ example: 'common.save' }) @IsString() key!: string; @ApiPropertyOptional() @IsOptional() @IsString() description?: string; }
class TranslationDto { @ApiProperty() @IsString() namespace!: string; @ApiProperty() @IsString() key!: string; @ApiProperty({ enum: LOCALES }) @IsIn(LOCALES) locale!: string; @ApiProperty() @IsString() value!: string; }

@Injectable()
class I18nDbService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  listKeys() { return this.prisma.translationKey.findMany({ orderBy: [{ namespace: 'asc' }, { key: 'asc' }], take: 2000 }); }
  async createKey(user: AuthenticatedUser, dto: KeyDto) {
    const row = await this.prisma.translationKey.upsert({ where: { namespace_key: { namespace: dto.namespace, key: dto.key } }, create: { namespace: dto.namespace, key: dto.key, description: dto.description, isSystem: false }, update: { description: dto.description } });
    await this.audit.record({ tenantId: user.tenantId, actorId: user.id, action: 'i18n.key.create', entityType: 'TranslationKey', entityId: row.id });
    return row;
  }
  /** Upsert a translation value. tenantId set = tenant override; null = system default. */
  async upsertTranslation(user: AuthenticatedUser, dto: TranslationDto, asOverride: boolean) {
    const key = await this.prisma.translationKey.upsert({ where: { namespace_key: { namespace: dto.namespace, key: dto.key } }, create: { namespace: dto.namespace, key: dto.key, isSystem: false }, update: {} });
    const tenantId = asOverride ? (user.tenantId ?? null) : null;
    // find-then-write: Prisma can't use a null in a compound unique `where`.
    const existing = await this.prisma.translation.findFirst({ where: { translationKeyId: key.id, tenantId, locale: dto.locale } });
    const row = existing
      ? await this.prisma.translation.update({ where: { id: existing.id }, data: { value: dto.value } })
      : await this.prisma.translation.create({ data: { translationKeyId: key.id, tenantId, locale: dto.locale, value: dto.value } });
    await this.audit.record({ tenantId: user.tenantId, actorId: user.id, action: 'i18n.translation.upsert', entityType: 'Translation', entityId: row.id });
    return row;
  }

  /**
   * DB-driven messages for a locale (PRD §18.4). Tenant overrides take
   * precedence over system defaults. Returns { namespace: { key: value } }.
   */
  async messages(locale: string, tenantId: string | null) {
    const rows = await this.prisma.translation.findMany({
      where: { locale, OR: [{ tenantId: null }, ...(tenantId ? [{ tenantId }] : [])] },
      include: { translationKey: { select: { namespace: true, key: true } } },
    });
    const out: Record<string, Record<string, string>> = {};
    // Apply system defaults (tenantId null) first, then tenant overrides last so they win.
    const ordered = [...rows].sort((a, b) => (a.tenantId === null ? 0 : 1) - (b.tenantId === null ? 0 : 1));
    for (const r of ordered) {
      const ns = r.translationKey.namespace;
      (out[ns] ??= {})[r.translationKey.key] = r.value;
    }
    return out;
  }
}

@ApiTags('Localization (DB)')
@Controller('i18n')
class I18nDbController {
  constructor(private readonly s: I18nDbService) {}

  @Public()
  @Get('locales')
  @ApiOperation({ summary: 'Supported locales' })
  locales() { return { locales: LOCALES, default: 'id-ID' }; }

  @Public()
  @Get('messages')
  @ApiQuery({ name: 'locale', required: false })
  @ApiOperation({ summary: 'DB-driven translation messages (tenant overrides system)' })
  messages(@Query('locale') locale = 'id-ID', @Headers('x-tenant-id') tenantId?: string) {
    // Public route: TenantGuard is skipped, so read the tenant from the header.
    return this.s.messages(LOCALES.includes(locale) ? locale : 'id-ID', tenantId ?? null);
  }

  @ApiBearerAuth()
  @Get('keys')
  @RequirePermissions('settings.read.tenant')
  @ApiOperation({ summary: 'List translation keys' })
  keys() { return this.s.listKeys(); }

  @ApiBearerAuth()
  @Post('keys')
  @RequirePermissions('settings.update.tenant')
  @ApiOperation({ summary: 'Create a translation key' })
  createKey(@CurrentUser() user: AuthenticatedUser, @Body() dto: KeyDto) { return this.s.createKey(user, dto); }

  @ApiBearerAuth()
  @Post('translations')
  @RequirePermissions('settings.update.tenant')
  @ApiOperation({ summary: 'Set a system-default translation value' })
  setSystem(@CurrentUser() user: AuthenticatedUser, @Body() dto: TranslationDto) { return this.s.upsertTranslation(user, dto, false); }

  @ApiBearerAuth()
  @Post('translations/override')
  @RequirePermissions('settings.update.tenant')
  @ApiOperation({ summary: 'Set a tenant-specific translation override' })
  setOverride(@CurrentUser() user: AuthenticatedUser, @Body() dto: TranslationDto) { return this.s.upsertTranslation(user, dto, true); }
}

@Module({ controllers: [I18nDbController], providers: [I18nDbService] })
export class I18nDbModule {}
