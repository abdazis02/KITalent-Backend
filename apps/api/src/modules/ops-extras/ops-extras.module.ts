import { Module } from '@nestjs/common';
import { BadRequestException, Body, Controller, ForbiddenException, Get, Injectable, NotFoundException, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiProperty, ApiPropertyOptional, ApiQuery, ApiTags } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser, type AuthenticatedUser } from '../../common/decorators/current-user.decorator';

class ReplacementDto { @ApiProperty() @IsUUID() placementId!: string; @ApiProperty() @IsString() reason!: string; @ApiProperty() @IsDateString() requestedDate!: string; @ApiPropertyOptional() @IsOptional() @IsDateString() targetReplacementDate?: string; }
class WorkScheduleDto { @ApiProperty() @IsString() name!: string; @ApiPropertyOptional() @IsOptional() @IsString() description?: string; @ApiPropertyOptional({ enum: ['fixed', 'rotating', 'flexible'], default: 'fixed' }) @IsOptional() @IsString() scheduleType?: string; }
class AttendancePolicyDto {
  @ApiProperty() @IsString() name!: string;
  @ApiPropertyOptional({ default: true }) @IsOptional() @IsBoolean() requireGps?: boolean;
  @ApiPropertyOptional({ default: true }) @IsOptional() @IsBoolean() requireSelfie?: boolean;
  @ApiPropertyOptional({ default: false }) @IsOptional() @IsBoolean() allowOutsideGeofence?: boolean;
  @ApiPropertyOptional({ default: 0 }) @IsOptional() @IsInt() @Min(0) lateToleranceMinutes?: number;
}
class NotifTemplateDto { @ApiProperty() @IsString() code!: string; @ApiProperty({ enum: ['in_app', 'email', 'whatsapp', 'fcm'] }) @IsString() channel!: string; @ApiPropertyOptional() @IsOptional() @IsString() subject?: string; @ApiProperty() @IsString() body!: string; }

@Injectable()
class OpsExtrasService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}
  private tid(t: string | null): string { if (!t) throw new ForbiddenException('A tenant context is required'); return t; }

  // Replacement requests + placement histories (PRD §17.8)
  listReplacements(t: string | null) { return this.prisma.replacementRequest.findMany({ where: { tenantId: this.tid(t) }, orderBy: { createdAt: 'desc' }, take: 500 }); }
  async createReplacement(u: AuthenticatedUser, dto: ReplacementDto) {
    const t = this.tid(u.tenantId);
    const pl = await this.prisma.placement.findFirst({ where: { id: dto.placementId, tenantId: t, deletedAt: null }, select: { id: true } });
    if (!pl) throw new NotFoundException('Placement not found');
    const r = await this.prisma.replacementRequest.create({ data: { tenantId: t, placementId: dto.placementId, requestedBy: u.id, reason: dto.reason, requestedDate: new Date(dto.requestedDate), targetReplacementDate: dto.targetReplacementDate ? new Date(dto.targetReplacementDate) : null } });
    await this.prisma.placement.update({ where: { id: dto.placementId }, data: { status: 'replacement_requested' } });
    await this.audit.record({ tenantId: t, actorId: u.id, action: 'replacement.create', entityType: 'ReplacementRequest', entityId: r.id }); return r;
  }
  async decideReplacement(u: AuthenticatedUser, id: string, approve: boolean) {
    const t = this.tid(u.tenantId); const r = await this.prisma.replacementRequest.findFirst({ where: { id, tenantId: t } });
    if (!r) throw new NotFoundException('Replacement request not found');
    if (r.status !== 'submitted') throw new BadRequestException(`Cannot review in status "${r.status}"`);
    const row = await this.prisma.replacementRequest.update({ where: { id }, data: { status: approve ? 'approved' : 'rejected' } });
    await this.audit.record({ tenantId: t, actorId: u.id, action: approve ? 'replacement.approve' : 'replacement.reject', entityType: 'ReplacementRequest', entityId: id }); return row;
  }
  placementHistory(t: string | null, placementId: string) { return this.prisma.placementHistory.findMany({ where: { tenantId: this.tid(t), placementId }, orderBy: { effectiveDate: 'desc' } }); }

  // Work schedules (§17.9)
  listWorkSchedules(t: string | null) { return this.prisma.workSchedule.findMany({ where: { tenantId: this.tid(t) }, orderBy: { name: 'asc' }, take: 500 }); }
  async createWorkSchedule(u: AuthenticatedUser, dto: WorkScheduleDto) { const t = this.tid(u.tenantId); const r = await this.prisma.workSchedule.create({ data: { tenantId: t, ...dto } }); await this.audit.record({ tenantId: t, actorId: u.id, action: 'workSchedule.create', entityType: 'WorkSchedule', entityId: r.id }); return r; }

  // Attendance policies (§17.9)
  listPolicies(t: string | null) { return this.prisma.attendancePolicy.findMany({ where: { tenantId: this.tid(t) }, orderBy: { name: 'asc' }, take: 500 }); }
  async createPolicy(u: AuthenticatedUser, dto: AttendancePolicyDto) { const t = this.tid(u.tenantId); const r = await this.prisma.attendancePolicy.create({ data: { tenantId: t, ...dto } }); await this.audit.record({ tenantId: t, actorId: u.id, action: 'attendancePolicy.create', entityType: 'AttendancePolicy', entityId: r.id }); return r; }

  // Notification templates (§17.15)
  listTemplates(t: string | null) { return this.prisma.notificationTemplate.findMany({ where: { OR: [{ tenantId: this.tid(t) }, { tenantId: null }] }, orderBy: { code: 'asc' }, take: 500 }); }
  async createTemplate(u: AuthenticatedUser, dto: NotifTemplateDto) { const t = this.tid(u.tenantId); const r = await this.prisma.notificationTemplate.create({ data: { tenantId: t, ...dto } }); await this.audit.record({ tenantId: t, actorId: u.id, action: 'notificationTemplate.create', entityType: 'NotificationTemplate', entityId: r.id }); return r; }

  // Biometric logs (§17.9)
  listBiometricLogs(t: string | null, deviceId?: string) { return this.prisma.biometricLog.findMany({ where: { tenantId: this.tid(t), ...(deviceId ? { deviceId } : {}) }, orderBy: { logTime: 'desc' }, take: 200 }); }
}

@ApiTags('Operations Extras')
@ApiBearerAuth()
@Controller()
class OpsExtrasController {
  constructor(private readonly s: OpsExtrasService) {}
  @Get('replacement-requests') @RequirePermissions('placement.read.tenant') @ApiOperation({ summary: 'List replacement requests' }) listRep(@CurrentTenant() t: string | null) { return this.s.listReplacements(t); }
  @Post('replacement-requests') @RequirePermissions('placement.create.tenant') @ApiOperation({ summary: 'Request a worker replacement' }) createRep(@CurrentUser() u: AuthenticatedUser, @Body() dto: ReplacementDto) { return this.s.createReplacement(u, dto); }
  @Post('replacement-requests/:id/approve') @RequirePermissions('placement.approve.tenant') @ApiOperation({ summary: 'Approve a replacement request' }) approveRep(@CurrentUser() u: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) { return this.s.decideReplacement(u, id, true); }
  @Post('replacement-requests/:id/reject') @RequirePermissions('placement.approve.tenant') @ApiOperation({ summary: 'Reject a replacement request' }) rejectRep(@CurrentUser() u: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) { return this.s.decideReplacement(u, id, false); }
  @Get('placements/:id/histories') @RequirePermissions('placement.read.tenant') @ApiOperation({ summary: 'Placement rotation/mutation history' }) plHist(@CurrentTenant() t: string | null, @Param('id', ParseUUIDPipe) id: string) { return this.s.placementHistory(t, id); }

  @Get('work-schedules') @RequirePermissions('schedule.read.tenant') @ApiOperation({ summary: 'List work schedules' }) listWs(@CurrentTenant() t: string | null) { return this.s.listWorkSchedules(t); }
  @Post('work-schedules') @RequirePermissions('schedule.create.tenant') @ApiOperation({ summary: 'Create a work schedule' }) createWs(@CurrentUser() u: AuthenticatedUser, @Body() dto: WorkScheduleDto) { return this.s.createWorkSchedule(u, dto); }
  @Get('attendance-policies') @RequirePermissions('attendance.read.tenant') @ApiOperation({ summary: 'List attendance policies' }) listPol(@CurrentTenant() t: string | null) { return this.s.listPolicies(t); }
  @Post('attendance-policies') @RequirePermissions('attendance.create.tenant') @ApiOperation({ summary: 'Create an attendance policy' }) createPol(@CurrentUser() u: AuthenticatedUser, @Body() dto: AttendancePolicyDto) { return this.s.createPolicy(u, dto); }
  @Get('notification-templates') @RequirePermissions('notification.read.tenant') @ApiOperation({ summary: 'List notification templates' }) listTpl(@CurrentTenant() t: string | null) { return this.s.listTemplates(t); }
  @Post('notification-templates') @RequirePermissions('notification.create.tenant') @ApiOperation({ summary: 'Create a notification template' }) createTpl(@CurrentUser() u: AuthenticatedUser, @Body() dto: NotifTemplateDto) { return this.s.createTemplate(u, dto); }
  @Get('biometric/logs') @RequirePermissions('fingerprint.read.tenant') @ApiQuery({ name: 'deviceId', required: false }) @ApiOperation({ summary: 'List biometric logs' }) bioLogs(@CurrentTenant() t: string | null, @Query('deviceId') deviceId?: string) { return this.s.listBiometricLogs(t, deviceId); }
}

@Module({ controllers: [OpsExtrasController], providers: [OpsExtrasService] })
export class OpsExtrasModule {}
