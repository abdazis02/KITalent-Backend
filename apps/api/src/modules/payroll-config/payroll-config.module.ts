import { Module } from '@nestjs/common';
import { BadRequestException, Body, Controller, ForbiddenException, Get, Injectable, NotFoundException, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser, type AuthenticatedUser } from '../../common/decorators/current-user.decorator';

class GroupDto { @ApiProperty() @IsString() name!: string; @ApiPropertyOptional() @IsOptional() @IsString() description?: string; @ApiPropertyOptional({ example: 'monthly' }) @IsOptional() @IsString() paymentSchedule?: string; }
class PeriodDto {
  @ApiProperty() @IsUUID() payrollGroupId!: string;
  @ApiProperty({ example: 'Juni 2026' }) @IsString() name!: string;
  @ApiProperty() @IsDateString() startDate!: string;
  @ApiProperty() @IsDateString() endDate!: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() paymentDate?: string;
}
class ReimbTypeDto { @ApiProperty() @IsString() code!: string; @ApiProperty() @IsString() name!: string; @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) maxAmount?: number; @ApiPropertyOptional({ default: true }) @IsOptional() @IsBoolean() requiresReceipt?: boolean; }

@Injectable()
class PayrollConfigService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}
  private tid(t: string | null): string { if (!t) throw new ForbiddenException('A tenant context is required'); return t; }

  // Payroll groups
  listGroups(t: string | null) { return this.prisma.payrollGroup.findMany({ where: { tenantId: this.tid(t), deletedAt: null }, orderBy: { name: 'asc' }, take: 500 }); }
  async createGroup(u: AuthenticatedUser, dto: GroupDto) {
    const t = this.tid(u.tenantId); const row = await this.prisma.payrollGroup.create({ data: { tenantId: t, ...dto } });
    await this.audit.record({ tenantId: t, actorId: u.id, action: 'payroll.group.create', entityType: 'PayrollGroup', entityId: row.id }); return row;
  }
  // Payroll periods
  listPeriods(t: string | null) { return this.prisma.payrollPeriod.findMany({ where: { tenantId: this.tid(t) }, orderBy: { startDate: 'desc' }, take: 500 }); }
  async createPeriod(u: AuthenticatedUser, dto: PeriodDto) {
    const t = this.tid(u.tenantId);
    const g = await this.prisma.payrollGroup.findFirst({ where: { id: dto.payrollGroupId, tenantId: t, deletedAt: null }, select: { id: true } });
    if (!g) throw new NotFoundException('Payroll group not found');
    const row = await this.prisma.payrollPeriod.create({ data: { tenantId: t, payrollGroupId: dto.payrollGroupId, name: dto.name, startDate: new Date(dto.startDate), endDate: new Date(dto.endDate), paymentDate: dto.paymentDate ? new Date(dto.paymentDate) : null } });
    await this.audit.record({ tenantId: t, actorId: u.id, action: 'payroll.period.create', entityType: 'PayrollPeriod', entityId: row.id }); return row;
  }
  // Reimbursement types
  listReimbTypes(t: string | null) { return this.prisma.reimbursementType.findMany({ where: { tenantId: this.tid(t) }, orderBy: { code: 'asc' }, take: 500 }); }
  async createReimbType(u: AuthenticatedUser, dto: ReimbTypeDto) {
    const t = this.tid(u.tenantId); const row = await this.prisma.reimbursementType.create({ data: { tenantId: t, ...dto } });
    await this.audit.record({ tenantId: t, actorId: u.id, action: 'reimbursement.type.create', entityType: 'ReimbursementType', entityId: row.id }); return row;
  }

  // Salary slips: generate from a payslip, publish, mark downloaded.
  listSlips(t: string | null) { return this.prisma.salarySlip.findMany({ where: { tenantId: this.tid(t) }, orderBy: { createdAt: 'desc' }, take: 500 }); }
  async generateSlip(u: AuthenticatedUser, payslipId: string) {
    const t = this.tid(u.tenantId);
    const ps = await this.prisma.payslip.findFirst({ where: { id: payslipId, tenantId: t }, select: { id: true, employeeId: true } });
    if (!ps) throw new NotFoundException('Payslip not found');
    const row = await this.prisma.salarySlip.upsert({ where: { payslipId }, create: { tenantId: t, payslipId, employeeId: ps.employeeId, status: 'draft' }, update: {} });
    await this.audit.record({ tenantId: t, actorId: u.id, action: 'salarySlip.generate', entityType: 'SalarySlip', entityId: row.id }); return row;
  }
  async publishSlip(u: AuthenticatedUser, id: string) {
    const t = this.tid(u.tenantId);
    const s = await this.prisma.salarySlip.findFirst({ where: { id, tenantId: t } });
    if (!s) throw new NotFoundException('Salary slip not found');
    if (s.status === 'published') throw new BadRequestException('Already published');
    const row = await this.prisma.salarySlip.update({ where: { id }, data: { status: 'published', publishedAt: new Date() } });
    await this.audit.record({ tenantId: t, actorId: u.id, action: 'salarySlip.publish', entityType: 'SalarySlip', entityId: id }); return row;
  }
}

@ApiTags('Payroll Config')
@ApiBearerAuth()
@Controller()
class PayrollConfigController {
  constructor(private readonly s: PayrollConfigService) {}
  @Get('payroll/groups') @RequirePermissions('payroll.read.tenant') @ApiOperation({ summary: 'List payroll groups' }) groups(@CurrentTenant() t: string | null) { return this.s.listGroups(t); }
  @Post('payroll/groups') @RequirePermissions('payroll.create.tenant') @ApiOperation({ summary: 'Create payroll group' }) createGroup(@CurrentUser() u: AuthenticatedUser, @Body() dto: GroupDto) { return this.s.createGroup(u, dto); }
  @Get('payroll/periods') @RequirePermissions('payroll.read.tenant') @ApiOperation({ summary: 'List payroll periods' }) periods(@CurrentTenant() t: string | null) { return this.s.listPeriods(t); }
  @Post('payroll/periods') @RequirePermissions('payroll.create.tenant') @ApiOperation({ summary: 'Create payroll period' }) createPeriod(@CurrentUser() u: AuthenticatedUser, @Body() dto: PeriodDto) { return this.s.createPeriod(u, dto); }
  @Get('reimbursement-types') @RequirePermissions('reimbursement.read.tenant') @ApiOperation({ summary: 'List reimbursement types' }) reimbTypes(@CurrentTenant() t: string | null) { return this.s.listReimbTypes(t); }
  @Post('reimbursement-types') @RequirePermissions('reimbursement.create.tenant') @ApiOperation({ summary: 'Create reimbursement type' }) createReimbType(@CurrentUser() u: AuthenticatedUser, @Body() dto: ReimbTypeDto) { return this.s.createReimbType(u, dto); }
  @Get('salary-slips') @RequirePermissions('payroll.read.tenant') @ApiOperation({ summary: 'List salary slips' }) slips(@CurrentTenant() t: string | null) { return this.s.listSlips(t); }
  @Post('payslips/:id/salary-slip') @RequirePermissions('salarySlip.generate.tenant') @ApiOperation({ summary: 'Generate a salary slip from a payslip' }) gen(@CurrentUser() u: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) { return this.s.generateSlip(u, id); }
  @Post('salary-slips/:id/publish') @RequirePermissions('salarySlip.generate.tenant') @ApiOperation({ summary: 'Publish a salary slip to the employee' }) pub(@CurrentUser() u: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) { return this.s.publishSlip(u, id); }
}

@Module({ controllers: [PayrollConfigController], providers: [PayrollConfigService] })
export class PayrollConfigModule {}
