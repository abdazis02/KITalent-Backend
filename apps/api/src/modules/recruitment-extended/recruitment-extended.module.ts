import { Module } from '@nestjs/common';
import { BadRequestException, Body, Controller, ForbiddenException, Get, Injectable, NotFoundException, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsDateString, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser, type AuthenticatedUser } from '../../common/decorators/current-user.decorator';

class RequisitionDto {
  @ApiProperty() @IsString() title!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiProperty({ default: 1 }) @IsInt() @Min(1) quantity!: number;
  @ApiPropertyOptional() @IsOptional() @IsUUID() manpowerRequestId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() clientId?: string;
}
class ApplicationDto { @ApiProperty() @IsUUID() candidateId!: string; @ApiProperty() @IsUUID() vacancyId!: string; }
class StageDto { @ApiProperty({ example: 'interviewed' }) @IsString() stage!: string; @ApiPropertyOptional() @IsOptional() @IsInt() score?: number; }
class InterviewDto { @ApiProperty() @IsDateString() scheduledAt!: string; @ApiPropertyOptional() @IsOptional() @IsUUID() interviewerId?: string; @ApiPropertyOptional() @IsOptional() @IsString() location?: string; @ApiPropertyOptional() @IsOptional() @IsString() meetingLink?: string; }
class ResultDto { @ApiProperty({ enum: ['passed', 'failed', 'consideration'] }) @IsString() result!: string; @ApiPropertyOptional() @IsOptional() @IsInt() score?: number; @ApiPropertyOptional() @IsOptional() @IsString() notes?: string; }
class OfferDto { @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) offeredSalary?: number; @ApiPropertyOptional() @IsOptional() @IsDateString() startDate?: string; }
class OnboardingDto { @ApiProperty() @IsString() title!: string; @ApiPropertyOptional() @IsOptional() @IsString() description?: string; @ApiPropertyOptional() @IsOptional() @IsDateString() dueDate?: string; @ApiPropertyOptional() @IsOptional() @IsUUID() employeeId?: string; @ApiPropertyOptional() @IsOptional() @IsUUID() candidateId?: string; }

@Injectable()
class RecruitmentExtService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}
  private tid(t: string | null): string { if (!t) throw new ForbiddenException('A tenant context is required'); return t; }

  // Requisitions
  listReq(t: string | null) { return this.prisma.jobRequisition.findMany({ where: { tenantId: this.tid(t) }, orderBy: { createdAt: 'desc' }, take: 500 }); }
  async createReq(u: AuthenticatedUser, dto: RequisitionDto) { const t = this.tid(u.tenantId); const r = await this.prisma.jobRequisition.create({ data: { tenantId: t, ...dto } }); await this.audit.record({ tenantId: t, actorId: u.id, action: 'requisition.create', entityType: 'JobRequisition', entityId: r.id }); return r; }

  // Applications
  listApps(t: string | null) { return this.prisma.candidateApplication.findMany({ where: { tenantId: this.tid(t) }, orderBy: { createdAt: 'desc' }, take: 500 }); }
  async apply(u: AuthenticatedUser, dto: ApplicationDto) {
    const t = this.tid(u.tenantId);
    const [c, v] = await Promise.all([
      this.prisma.candidate.findFirst({ where: { id: dto.candidateId, tenantId: t, deletedAt: null }, select: { id: true } }),
      this.prisma.jobVacancy.findFirst({ where: { id: dto.vacancyId, tenantId: t, deletedAt: null }, select: { id: true } }),
    ]);
    if (!c) throw new NotFoundException('Candidate not found'); if (!v) throw new NotFoundException('Vacancy not found');
    const row = await this.prisma.candidateApplication.create({ data: { tenantId: t, candidateId: dto.candidateId, vacancyId: dto.vacancyId } });
    await this.audit.record({ tenantId: t, actorId: u.id, action: 'application.create', entityType: 'CandidateApplication', entityId: row.id }); return row;
  }
  async moveStage(u: AuthenticatedUser, id: string, dto: StageDto) {
    const t = this.tid(u.tenantId); const a = await this.prisma.candidateApplication.findFirst({ where: { id, tenantId: t } });
    if (!a) throw new NotFoundException('Application not found');
    const row = await this.prisma.candidateApplication.update({ where: { id }, data: { currentStage: dto.stage, pipelineStatus: dto.stage, score: dto.score } });
    await this.audit.record({ tenantId: t, actorId: u.id, action: 'application.move', entityType: 'CandidateApplication', entityId: id, metadata: { stage: dto.stage } }); return row;
  }

  // Interviews
  async scheduleInterview(u: AuthenticatedUser, applicationId: string, dto: InterviewDto) {
    const t = this.tid(u.tenantId); const a = await this.prisma.candidateApplication.findFirst({ where: { id: applicationId, tenantId: t }, select: { id: true } });
    if (!a) throw new NotFoundException('Application not found');
    const row = await this.prisma.interviewSchedule.create({ data: { tenantId: t, candidateApplicationId: applicationId, scheduledAt: new Date(dto.scheduledAt), interviewerId: dto.interviewerId, location: dto.location, meetingLink: dto.meetingLink } });
    await this.audit.record({ tenantId: t, actorId: u.id, action: 'interview.schedule', entityType: 'InterviewSchedule', entityId: row.id }); return row;
  }
  async recordResult(u: AuthenticatedUser, interviewId: string, dto: ResultDto) {
    const t = this.tid(u.tenantId); const iv = await this.prisma.interviewSchedule.findFirst({ where: { id: interviewId, tenantId: t }, select: { id: true } });
    if (!iv) throw new NotFoundException('Interview not found');
    const row = await this.prisma.interviewResult.upsert({ where: { interviewScheduleId: interviewId }, create: { tenantId: t, interviewScheduleId: interviewId, result: dto.result, score: dto.score, notes: dto.notes }, update: { result: dto.result, score: dto.score, notes: dto.notes } });
    await this.prisma.interviewSchedule.update({ where: { id: interviewId }, data: { status: 'completed' } });
    await this.audit.record({ tenantId: t, actorId: u.id, action: 'interview.result', entityType: 'InterviewResult', entityId: row.id }); return row;
  }

  // Offers
  async createOffer(u: AuthenticatedUser, applicationId: string, dto: OfferDto) {
    const t = this.tid(u.tenantId); const a = await this.prisma.candidateApplication.findFirst({ where: { id: applicationId, tenantId: t }, select: { id: true } });
    if (!a) throw new NotFoundException('Application not found');
    const row = await this.prisma.candidateOffer.create({ data: { tenantId: t, candidateApplicationId: applicationId, offeredSalary: dto.offeredSalary, startDate: dto.startDate ? new Date(dto.startDate) : null } });
    await this.audit.record({ tenantId: t, actorId: u.id, action: 'offer.create', entityType: 'CandidateOffer', entityId: row.id }); return row;
  }
  async offerDecision(u: AuthenticatedUser, id: string, accept: boolean) {
    const t = this.tid(u.tenantId); const o = await this.prisma.candidateOffer.findFirst({ where: { id, tenantId: t } });
    if (!o) throw new NotFoundException('Offer not found');
    if (!['draft', 'sent'].includes(o.status)) throw new BadRequestException(`Cannot decide an offer in status "${o.status}"`);
    const row = await this.prisma.candidateOffer.update({ where: { id }, data: { status: accept ? 'accepted' : 'rejected' } });
    if (accept) await this.prisma.candidateApplication.update({ where: { id: o.candidateApplicationId }, data: { currentStage: 'accepted', pipelineStatus: 'accepted' } });
    await this.audit.record({ tenantId: t, actorId: u.id, action: accept ? 'offer.accept' : 'offer.reject', entityType: 'CandidateOffer', entityId: id }); return row;
  }

  // Onboarding
  listOnboarding(t: string | null) { return this.prisma.onboardingTask.findMany({ where: { tenantId: this.tid(t) }, orderBy: { createdAt: 'desc' }, take: 500 }); }
  async createOnboarding(u: AuthenticatedUser, dto: OnboardingDto) {
    const t = this.tid(u.tenantId);
    const row = await this.prisma.onboardingTask.create({ data: { tenantId: t, title: dto.title, description: dto.description, dueDate: dto.dueDate ? new Date(dto.dueDate) : null, employeeId: dto.employeeId, candidateId: dto.candidateId } });
    await this.audit.record({ tenantId: t, actorId: u.id, action: 'onboarding.create', entityType: 'OnboardingTask', entityId: row.id }); return row;
  }
}

@ApiTags('Recruitment (Full)')
@ApiBearerAuth()
@Controller()
class RecruitmentExtController {
  constructor(private readonly s: RecruitmentExtService) {}
  @Get('job-requisitions') @RequirePermissions('recruitment.read.tenant') @ApiOperation({ summary: 'List job requisitions' }) listReq(@CurrentTenant() t: string | null) { return this.s.listReq(t); }
  @Post('job-requisitions') @RequirePermissions('recruitment.create.tenant') @ApiOperation({ summary: 'Create a job requisition' }) createReq(@CurrentUser() u: AuthenticatedUser, @Body() dto: RequisitionDto) { return this.s.createReq(u, dto); }
  @Get('candidate-applications') @RequirePermissions('candidate.read.tenant') @ApiOperation({ summary: 'List candidate applications' }) listApps(@CurrentTenant() t: string | null) { return this.s.listApps(t); }
  @Post('candidate-applications') @RequirePermissions('candidate.create.tenant') @ApiOperation({ summary: 'Apply a candidate to a vacancy' }) apply(@CurrentUser() u: AuthenticatedUser, @Body() dto: ApplicationDto) { return this.s.apply(u, dto); }
  @Post('candidate-applications/:id/stage') @RequirePermissions('candidate.update.tenant') @ApiOperation({ summary: 'Move an application stage' }) move(@CurrentUser() u: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: StageDto) { return this.s.moveStage(u, id, dto); }
  @Post('candidate-applications/:id/interviews') @RequirePermissions('candidate.update.tenant') @ApiOperation({ summary: 'Schedule an interview' }) interview(@CurrentUser() u: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: InterviewDto) { return this.s.scheduleInterview(u, id, dto); }
  @Post('interviews/:id/result') @RequirePermissions('candidate.update.tenant') @ApiOperation({ summary: 'Record an interview result' }) result(@CurrentUser() u: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: ResultDto) { return this.s.recordResult(u, id, dto); }
  @Post('candidate-applications/:id/offer') @RequirePermissions('candidate.update.tenant') @ApiOperation({ summary: 'Create an offer' }) offer(@CurrentUser() u: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: OfferDto) { return this.s.createOffer(u, id, dto); }
  @Post('candidate-offers/:id/accept') @RequirePermissions('candidate.update.tenant') @ApiOperation({ summary: 'Accept an offer' }) accept(@CurrentUser() u: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) { return this.s.offerDecision(u, id, true); }
  @Post('candidate-offers/:id/reject') @RequirePermissions('candidate.update.tenant') @ApiOperation({ summary: 'Reject an offer' }) reject(@CurrentUser() u: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) { return this.s.offerDecision(u, id, false); }
  @Get('onboarding-tasks') @RequirePermissions('recruitment.read.tenant') @ApiOperation({ summary: 'List onboarding tasks' }) listOnb(@CurrentTenant() t: string | null) { return this.s.listOnboarding(t); }
  @Post('onboarding-tasks') @RequirePermissions('recruitment.create.tenant') @ApiOperation({ summary: 'Create an onboarding task' }) createOnb(@CurrentUser() u: AuthenticatedUser, @Body() dto: OnboardingDto) { return this.s.createOnboarding(u, dto); }
}

@Module({ controllers: [RecruitmentExtController], providers: [RecruitmentExtService] })
export class RecruitmentExtendedModule {}
