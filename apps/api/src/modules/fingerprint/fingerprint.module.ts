import { Module } from '@nestjs/common';
import { Body, Controller, ForbiddenException, Get, Injectable, NotFoundException, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsDateString, IsInt, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser, type AuthenticatedUser } from '../../common/decorators/current-user.decorator';

class RegisterDeviceDto {
  @ApiProperty({ example: 'FP-001' })
  @IsString()
  code!: string;

  @ApiProperty({ example: 'Mesin Absen Lobby' })
  @IsString()
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ipAddress?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  port?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ example: 'tcp' })
  @IsOptional()
  @IsString()
  connectionType?: string;
}

class FingerprintLogDto {
  @ApiProperty()
  @IsUUID()
  employeeId!: string;

  @ApiProperty({ example: '2026-06-15T08:01:00Z' })
  @IsDateString()
  timestamp!: string;
}

class SyncLogsDto {
  @ApiProperty({ type: [FingerprintLogDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FingerprintLogDto)
  logs!: FingerprintLogDto[];
}

function startOfDay(d: Date): Date {
  // UTC midnight to align with Postgres @db.Date and yyyy-mm-dd range filters.
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

@Injectable()
class FingerprintService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  private requireTenant(tenantId: string | null): string {
    if (!tenantId) throw new ForbiddenException('A tenant context is required');
    return tenantId;
  }

  async register(user: AuthenticatedUser, dto: RegisterDeviceDto) {
    const tid = this.requireTenant(user.tenantId);
    const device = await this.prisma.fingerprintDevice.create({ data: { ...dto, tenantId: tid, createdBy: user.id } });
    await this.audit.record({ tenantId: tid, actorId: user.id, action: 'fingerprint.register', entityType: 'FingerprintDevice', entityId: device.id });
    return device;
  }

  list(tenantId: string | null) {
    const tid = this.requireTenant(tenantId);
    return this.prisma.fingerprintDevice.findMany({ where: { tenantId: tid, deletedAt: null }, orderBy: { code: 'asc' }, take: 500 });
  }

  /**
   * Ingest pushed attendance logs: the earliest stamp per employee/day becomes
   * check-in, the latest check-out (PRD §10.14 → §10.13). Idempotent per day.
   */
  async sync(user: AuthenticatedUser, id: string, dto: SyncLogsDto) {
    const tid = this.requireTenant(user.tenantId);
    const device = await this.prisma.fingerprintDevice.findFirst({ where: { id, tenantId: tid, deletedAt: null } });
    if (!device) throw new NotFoundException('Device not found');

    let applied = 0;
    for (const log of dto.logs) {
      const ts = new Date(log.timestamp);
      const date = startOfDay(ts);
      const employee = await this.prisma.employee.findFirst({ where: { id: log.employeeId, tenantId: tid, deletedAt: null }, select: { id: true } });
      if (!employee) continue;

      const existing = await this.prisma.attendanceRecord.findUnique({ where: { employeeId_date: { employeeId: log.employeeId, date } } });
      if (!existing) {
        await this.prisma.attendanceRecord.create({ data: { tenantId: tid, employeeId: log.employeeId, date, checkInAt: ts, status: 'present', deviceId: device.code, createdBy: user.id } });
      } else {
        const checkInAt = !existing.checkInAt || ts < existing.checkInAt ? ts : existing.checkInAt;
        const checkOutAt = !existing.checkOutAt || ts > existing.checkOutAt ? ts : existing.checkOutAt;
        await this.prisma.attendanceRecord.update({ where: { id: existing.id }, data: { checkInAt, checkOutAt: checkOutAt > checkInAt ? checkOutAt : existing.checkOutAt, deviceId: device.code, updatedBy: user.id } });
      }
      applied++;
    }

    await this.prisma.fingerprintDevice.update({ where: { id }, data: { lastSyncAt: new Date(), updatedBy: user.id } });
    await this.audit.record({ tenantId: tid, actorId: user.id, action: 'fingerprint.sync', entityType: 'FingerprintDevice', entityId: id, metadata: { applied } });
    return { applied, lastSyncAt: new Date().toISOString() };
  }
}

@ApiTags('Fingerprint')
@ApiBearerAuth()
@Controller('fingerprint/devices')
class FingerprintController {
  constructor(private readonly service: FingerprintService) {}

  @Get()
  @RequirePermissions('fingerprint.read.tenant')
  @ApiOperation({ summary: 'List fingerprint devices' })
  list(@CurrentTenant() tenantId: string | null) {
    return this.service.list(tenantId);
  }

  @Post()
  @RequirePermissions('fingerprint.create.tenant')
  @ApiOperation({ summary: 'Register a fingerprint device' })
  register(@CurrentUser() user: AuthenticatedUser, @Body() dto: RegisterDeviceDto) {
    return this.service.register(user, dto);
  }

  @Post(':id/sync')
  @RequirePermissions('fingerprint.sync.tenant')
  @ApiOperation({ summary: 'Push device logs → attendance records' })
  sync(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: SyncLogsDto) {
    return this.service.sync(user, id, dto);
  }
}

@Module({
  controllers: [FingerprintController],
  providers: [FingerprintService],
})
export class FingerprintModule {}
