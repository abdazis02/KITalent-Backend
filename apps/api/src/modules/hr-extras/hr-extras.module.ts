import { Module } from '@nestjs/common';
import { BadRequestException, Body, Controller, ForbiddenException, Get, Injectable, NotFoundException, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiProperty, ApiPropertyOptional, ApiQuery, ApiTags } from '@nestjs/swagger';
import { IsDateString, IsInt, IsOptional, IsString, IsUUID, Matches, Min } from 'class-validator';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotificationService } from '../notifications/notification.service';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser, type AuthenticatedUser } from '../../common/decorators/current-user.decorator';

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

class ScheduleDto { @ApiProperty() @IsUUID() employeeId!: string; @ApiProperty() @IsUUID() shiftId!: string; @ApiProperty() @IsDateString() scheduleDate!: string; @ApiPropertyOptional() @IsOptional() @IsUUID() workLocationId?: string; }
class PermissionDto { @ApiProperty() @IsUUID() employeeId!: string; @ApiProperty() @IsDateString() permissionDate!: string; @ApiPropertyOptional() @IsOptional() @Matches(HHMM) startTime?: string; @ApiPropertyOptional() @IsOptional() @Matches(HHMM) endTime?: string; @ApiProperty() @IsString() reason!: string; }
class BalanceDto { @ApiProperty() @IsUUID() employeeId!: string; @ApiProperty() @IsUUID() leaveTypeId!: string; @ApiProperty() @IsInt() year!: number; @ApiProperty() @IsInt() @Min(0) openingBalance!: number; }

@Injectable()
class HrExtrasService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService, private readonly notifications: NotificationService) {}
  private tid(t: string | null): string { if (!t) throw new ForbiddenException('A tenant context is required'); return t; }
  private async assertEmp(t: string, id: string) { const e = await this.prisma.employee.findFirst({ where: { id, tenantId: t, deletedAt: null }, select: { id: true } }); if (!e) throw new NotFoundException('Employee not found'); }

  // Employee schedules (roster)
  listSchedules(t: string | null, employeeId?: string, dateFrom?: string, dateTo?: string) {
    return this.prisma.employeeSchedule.findMany({
      where: { tenantId: this.tid(t), ...(employeeId ? { employeeId } : {}), ...(dateFrom || dateTo ? { scheduleDate: { ...(dateFrom ? { gte: new Date(dateFrom) } : {}), ...(dateTo ? { lte: new Date(dateTo) } : {}) } } : {}) },
      orderBy: { scheduleDate: 'asc' }, take: 500,
    });
  }
  async assignSchedule(u: AuthenticatedUser, dto: ScheduleDto) {
    const t = this.tid(u.tenantId); await this.assertEmp(t, dto.employeeId);
    const shift = await this.prisma.shift.findFirst({ where: { id: dto.shiftId, tenantId: t, deletedAt: null }, select: { id: true } });
    if (!shift) throw new NotFoundException('Shift not found');
    const row = await this.prisma.employeeSchedule.upsert({
      where: { employeeId_scheduleDate: { employeeId: dto.employeeId, scheduleDate: new Date(dto.scheduleDate) } },
      create: { tenantId: t, employeeId: dto.employeeId, shiftId: dto.shiftId, workLocationId: dto.workLocationId, scheduleDate: new Date(dto.scheduleDate) },
      update: { shiftId: dto.shiftId, workLocationId: dto.workLocationId },
    });
    await this.audit.record({ tenantId: t, actorId: u.id, action: 'schedule.assign', entityType: 'EmployeeSchedule', entityId: row.id }); return row;
  }

  // Permission requests (izin) — PRD §10.15
  listPermissions(t: string | null, status?: string) { return this.prisma.permissionRequest.findMany({ where: { tenantId: this.tid(t), ...(status ? { status } : {}) }, orderBy: { createdAt: 'desc' }, take: 500 }); }
  async createPermission(u: AuthenticatedUser, dto: PermissionDto) {
    const t = this.tid(u.tenantId); await this.assertEmp(t, dto.employeeId);
    const row = await this.prisma.permissionRequest.create({ data: { tenantId: t, employeeId: dto.employeeId, permissionDate: new Date(dto.permissionDate), startTime: dto.startTime, endTime: dto.endTime, reason: dto.reason } });
    await this.audit.record({ tenantId: t, actorId: u.id, action: 'permission.create', entityType: 'PermissionRequest', entityId: row.id }); return row;
  }
  async decidePermission(u: AuthenticatedUser, id: string, approve: boolean) {
    const t = this.tid(u.tenantId); const r = await this.prisma.permissionRequest.findFirst({ where: { id, tenantId: t } });
    if (!r) throw new NotFoundException('Permission request not found');
    if (r.status !== 'submitted') throw new BadRequestException(`Cannot review a request in status "${r.status}"`);
    const row = await this.prisma.permissionRequest.update({ where: { id }, data: { status: approve ? 'approved' : 'rejected', approvedBy: u.id, approvedAt: new Date() } });
    await this.audit.record({ tenantId: t, actorId: u.id, action: approve ? 'permission.approve' : 'permission.reject', entityType: 'PermissionRequest', entityId: id }); return row;
  }

  // Leave balances — PRD §17.10
  listBalances(t: string | null, employeeId?: string) { return this.prisma.leaveBalance.findMany({ where: { tenantId: this.tid(t), ...(employeeId ? { employeeId } : {}) }, orderBy: { year: 'desc' }, take: 500 }); }
  async upsertBalance(u: AuthenticatedUser, dto: BalanceDto) {
    const t = this.tid(u.tenantId); await this.assertEmp(t, dto.employeeId);
    const row = await this.prisma.leaveBalance.upsert({
      where: { employeeId_leaveTypeId_year: { employeeId: dto.employeeId, leaveTypeId: dto.leaveTypeId, year: dto.year } },
      create: { tenantId: t, employeeId: dto.employeeId, leaveTypeId: dto.leaveTypeId, year: dto.year, openingBalance: dto.openingBalance, earned: dto.openingBalance, remaining: dto.openingBalance },
      update: { openingBalance: dto.openingBalance },
    });
    await this.audit.record({ tenantId: t, actorId: u.id, action: 'leaveBalance.set', entityType: 'LeaveBalance', entityId: row.id }); return row;
  }
}

@ApiTags('HR Extras')
@ApiBearerAuth()
@Controller()
class HrExtrasController {
  constructor(private readonly s: HrExtrasService) {}
  @Get('employee-schedules') @RequirePermissions('schedule.read.tenant') @ApiQuery({ name: 'employeeId', required: false }) @ApiQuery({ name: 'dateFrom', required: false }) @ApiQuery({ name: 'dateTo', required: false }) @ApiOperation({ summary: 'List employee schedules (roster)' })
  schedules(@CurrentTenant() t: string | null, @Query('employeeId') employeeId?: string, @Query('dateFrom') dateFrom?: string, @Query('dateTo') dateTo?: string) { return this.s.listSchedules(t, employeeId, dateFrom, dateTo); }
  @Post('employee-schedules') @RequirePermissions('schedule.create.tenant') @ApiOperation({ summary: 'Assign a shift to an employee on a date' }) assign(@CurrentUser() u: AuthenticatedUser, @Body() dto: ScheduleDto) { return this.s.assignSchedule(u, dto); }

  @Get('permission-requests') @RequirePermissions('permission.read.tenant') @ApiQuery({ name: 'status', required: false }) @ApiOperation({ summary: 'List permission (izin) requests' }) listPerm(@CurrentTenant() t: string | null, @Query('status') status?: string) { return this.s.listPermissions(t, status); }
  @Post('permission-requests') @RequirePermissions('permission.create.own') @ApiOperation({ summary: 'Submit a permission (izin) request' }) createPerm(@CurrentUser() u: AuthenticatedUser, @Body() dto: PermissionDto) { return this.s.createPermission(u, dto); }
  @Post('permission-requests/:id/approve') @RequirePermissions('permission.approve.tenant') @ApiOperation({ summary: 'Approve a permission request' }) approvePerm(@CurrentUser() u: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) { return this.s.decidePermission(u, id, true); }
  @Post('permission-requests/:id/reject') @RequirePermissions('permission.approve.tenant') @ApiOperation({ summary: 'Reject a permission request' }) rejectPerm(@CurrentUser() u: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) { return this.s.decidePermission(u, id, false); }

  @Get('leave-balances') @RequirePermissions('leave.read.tenant') @ApiQuery({ name: 'employeeId', required: false }) @ApiOperation({ summary: 'List leave balances' }) balances(@CurrentTenant() t: string | null, @Query('employeeId') employeeId?: string) { return this.s.listBalances(t, employeeId); }
  @Post('leave-balances') @RequirePermissions('leave.create.tenant') @ApiOperation({ summary: 'Set an employee leave balance' }) setBalance(@CurrentUser() u: AuthenticatedUser, @Body() dto: BalanceDto) { return this.s.upsertBalance(u, dto); }
}

@Module({ controllers: [HrExtrasController], providers: [HrExtrasService] })
export class HrExtrasModule {}
