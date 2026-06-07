import { Module } from '@nestjs/common';
import { Body, Controller, ForbiddenException, Get, Injectable, NotFoundException, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser, type AuthenticatedUser } from '../../common/decorators/current-user.decorator';

class PlanDto {
  @ApiProperty() @IsString() name!: string;
  @ApiProperty() @IsString() code!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional({ default: 0 }) @IsOptional() @IsInt() @Min(0) priceMonthly?: number;
  @ApiPropertyOptional({ default: 0 }) @IsOptional() @IsInt() @Min(0) priceYearly?: number;
  @ApiPropertyOptional({ default: 0 }) @IsOptional() @IsInt() @Min(0) employeeLimit?: number;
  @ApiPropertyOptional({ default: 0 }) @IsOptional() @IsInt() @Min(0) storageLimitMb?: number;
}
class FeatureDto { @ApiProperty() @IsString() featureCode!: string; @ApiProperty() @IsString() featureName!: string; @ApiPropertyOptional({ default: true }) @IsOptional() @IsBoolean() isEnabled?: boolean; @ApiPropertyOptional() @IsOptional() @IsInt() limitValue?: number; }
class SubscribeDto { @ApiProperty() @IsUUID() tenantId!: string; @ApiProperty() @IsUUID() planId!: string; @ApiProperty() @IsDateString() startDate!: string; @ApiProperty() @IsDateString() endDate!: string; @ApiPropertyOptional({ default: 'monthly' }) @IsOptional() @IsString() billingCycle?: string; }

@Injectable()
class PlatformService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  listPlans() { return this.prisma.plan.findMany({ include: { features: true }, orderBy: { priceMonthly: 'asc' } }); }
  async createPlan(u: AuthenticatedUser, dto: PlanDto) { const r = await this.prisma.plan.create({ data: { ...dto } }); await this.audit.record({ tenantId: null, actorId: u.id, action: 'plan.create', entityType: 'Plan', entityId: r.id }); return r; }
  async addFeature(u: AuthenticatedUser, planId: string, dto: FeatureDto) {
    const plan = await this.prisma.plan.findUnique({ where: { id: planId }, select: { id: true } });
    if (!plan) throw new NotFoundException('Plan not found');
    const r = await this.prisma.planFeature.create({ data: { planId, featureCode: dto.featureCode, featureName: dto.featureName, isEnabled: dto.isEnabled ?? true, limitValue: dto.limitValue } });
    await this.audit.record({ tenantId: null, actorId: u.id, action: 'plan.feature.add', entityType: 'PlanFeature', entityId: r.id }); return r;
  }

  listSubscriptions() { return this.prisma.tenantSubscription.findMany({ include: { plan: { select: { name: true, code: true } } }, orderBy: { createdAt: 'desc' }, take: 500 }); }
  async subscribe(u: AuthenticatedUser, dto: SubscribeDto) {
    const [tenant, plan] = await Promise.all([
      this.prisma.tenant.findFirst({ where: { id: dto.tenantId, deletedAt: null }, select: { id: true } }),
      this.prisma.plan.findUnique({ where: { id: dto.planId }, select: { id: true, employeeLimit: true, storageLimitMb: true } }),
    ]);
    if (!tenant) throw new NotFoundException('Tenant not found'); if (!plan) throw new NotFoundException('Plan not found');
    const r = await this.prisma.tenantSubscription.create({ data: { tenantId: dto.tenantId, planId: dto.planId, startDate: new Date(dto.startDate), endDate: new Date(dto.endDate), billingCycle: dto.billingCycle ?? 'monthly', employeeLimit: plan.employeeLimit, storageLimitMb: plan.storageLimitMb, status: 'active' } });
    await this.audit.record({ tenantId: dto.tenantId, actorId: u.id, action: 'subscription.create', entityType: 'TenantSubscription', entityId: r.id }); return r;
  }

  loginHistory(tenantId: string | null) {
    if (!tenantId) throw new ForbiddenException('A tenant context is required');
    return this.prisma.loginHistory.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' }, take: 200 });
  }
}

@ApiTags('Platform / Subscription')
@ApiBearerAuth()
@Controller()
class PlatformController {
  constructor(private readonly s: PlatformService) {}
  @Get('subscription-plans') @RequirePermissions('subscription.read.all') @ApiOperation({ summary: 'List subscription plans' }) plans() { return this.s.listPlans(); }
  @Post('subscription-plans') @RequirePermissions('subscription.create.tenant') @ApiOperation({ summary: 'Create a subscription plan' }) createPlan(@CurrentUser() u: AuthenticatedUser, @Body() dto: PlanDto) { return this.s.createPlan(u, dto); }
  @Post('subscription-plans/:id/features') @RequirePermissions('subscription.create.tenant') @ApiOperation({ summary: 'Add a feature flag to a plan' }) addFeature(@CurrentUser() u: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: FeatureDto) { return this.s.addFeature(u, id, dto); }
  @Get('tenant-subscriptions') @RequirePermissions('subscription.read.all') @ApiOperation({ summary: 'List tenant subscriptions' }) subs() { return this.s.listSubscriptions(); }
  @Post('tenant-subscriptions') @RequirePermissions('subscription.create.tenant') @ApiOperation({ summary: 'Subscribe a tenant to a plan' }) subscribe(@CurrentUser() u: AuthenticatedUser, @Body() dto: SubscribeDto) { return this.s.subscribe(u, dto); }
  @Get('login-histories') @RequirePermissions('audit.read.tenant') @ApiOperation({ summary: 'List login history for the tenant' }) logins(@CurrentTenant() t: string | null) { return this.s.loginHistory(t); }
}

@Module({ controllers: [PlatformController], providers: [PlatformService] })
export class PlatformModule {}
