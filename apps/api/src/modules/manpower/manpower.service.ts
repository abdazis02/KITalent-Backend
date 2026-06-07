import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { buildMeta, normalizePagination, type Paginated } from '@kitalent/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ApprovalService } from '../approval/approval.service';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import type { ConvertToVacancyDto, CreateManpowerRequestDto, QueryManpowerDto } from './dto/manpower.dto';

@Injectable()
export class ManpowerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly approvals: ApprovalService,
  ) {}

  private requireTenant(tenantId: string | null): string {
    if (!tenantId) throw new ForbiddenException('A tenant context is required');
    return tenantId;
  }

  async create(user: AuthenticatedUser, dto: CreateManpowerRequestDto) {
    const tid = this.requireTenant(user.tenantId);
    const client = await this.prisma.client.findFirst({ where: { id: dto.clientId, tenantId: tid, deletedAt: null }, select: { id: true } });
    if (!client) throw new NotFoundException('Client not found in this tenant');
    if (dto.serviceCategoryId) {
      const cat = await this.prisma.serviceCategory.findFirst({ where: { id: dto.serviceCategoryId, tenantId: tid, deletedAt: null }, select: { id: true } });
      if (!cat) throw new NotFoundException('Service category not found in this tenant');
    }

    const request = await this.prisma.manpowerRequest.create({
      data: { ...dto, startDate: dto.startDate ? new Date(dto.startDate) : null, tenantId: tid, status: 'draft', createdBy: user.id },
    });
    await this.audit.record({ tenantId: tid, actorId: user.id, action: 'manpowerRequest.create', entityType: 'ManpowerRequest', entityId: request.id });
    return request;
  }

  async list(tenantId: string | null, query: QueryManpowerDto): Promise<Paginated<unknown>> {
    const tid = this.requireTenant(tenantId);
    const { page, pageSize } = normalizePagination(query);
    const where: Prisma.ManpowerRequestWhereInput = {
      tenantId: tid,
      deletedAt: null,
      ...(query.status ? { status: query.status as never } : {}),
      ...(query.clientId ? { clientId: query.clientId } : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.manpowerRequest.findMany({ where, orderBy: { createdAt: query.sortOrder }, skip: (page - 1) * pageSize, take: pageSize, include: { client: { select: { name: true } } } }),
      this.prisma.manpowerRequest.count({ where }),
    ]);
    return { data, meta: buildMeta(page, pageSize, total) };
  }

  private async load(tenantId: string, id: string) {
    const request = await this.prisma.manpowerRequest.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!request) throw new NotFoundException('Manpower request not found');
    return request;
  }

  findOne(tenantId: string | null, id: string) {
    return this.load(this.requireTenant(tenantId), id);
  }

  private async transition(user: AuthenticatedUser, id: string, allowed: string[], to: string, action: string, extra: Prisma.ManpowerRequestUpdateInput = {}) {
    const tid = this.requireTenant(user.tenantId);
    const request = await this.load(tid, id);
    if (!allowed.includes(request.status)) throw new BadRequestException(`Cannot ${action} a request in status "${request.status}"`);
    const updated = await this.prisma.manpowerRequest.update({ where: { id }, data: { status: to as never, updatedBy: user.id, ...extra } });
    await this.audit.record({ tenantId: tid, actorId: user.id, action: `manpowerRequest.${action}`, entityType: 'ManpowerRequest', entityId: id });
    return updated;
  }

  /**
   * Submit for client approval. If a tiered workflow is configured for
   * manpowerRequest (PRD §10.27), the engine owns the decision (→ client_approved
   * on approval via completeSource); otherwise the inline clientApprove applies.
   */
  async submit(user: AuthenticatedUser, id: string) {
    const updated = await this.transition(user, id, ['draft', 'need_revision'], 'submitted', 'submit');
    const tid = this.requireTenant(user.tenantId);
    const instance = await this.approvals.startForModule({ tenantId: tid, module: 'manpowerRequest', entityId: id, requestedBy: user.id });
    return instance ? { ...updated, approval: instance } : updated;
  }

  clientApprove(user: AuthenticatedUser, id: string) {
    return this.transition(user, id, ['submitted'], 'client_approved', 'clientApprove', { clientApprovedAt: new Date() });
  }

  operatorReview(user: AuthenticatedUser, id: string) {
    return this.transition(user, id, ['client_approved'], 'operator_reviewed', 'operatorReview', { operatorReviewedAt: new Date() });
  }

  fulfill(user: AuthenticatedUser, id: string) {
    return this.transition(user, id, ['in_recruitment', 'partially_fulfilled'], 'fulfilled', 'fulfill');
  }

  close(user: AuthenticatedUser, id: string) {
    return this.transition(user, id, ['fulfilled', 'cancelled', 'rejected'], 'closed', 'close');
  }

  /** Convert an approved request into a recruitment vacancy (PRD §10.8 → §10.9). */
  async convertToVacancy(user: AuthenticatedUser, id: string, dto: ConvertToVacancyDto) {
    const tid = this.requireTenant(user.tenantId);
    const request = await this.load(tid, id);
    if (!['client_approved', 'operator_reviewed'].includes(request.status)) {
      throw new BadRequestException(`Request must be client-approved/operator-reviewed to convert (current: ${request.status})`);
    }
    const existing = await this.prisma.jobVacancy.findFirst({ where: { tenantId: tid, code: dto.vacancyCode }, select: { id: true } });
    if (existing) throw new BadRequestException(`Vacancy code "${dto.vacancyCode}" already exists`);

    const vacancy = await this.prisma.$transaction(async (tx) => {
      const v = await tx.jobVacancy.create({
        data: {
          tenantId: tid,
          clientId: request.clientId,
          code: dto.vacancyCode,
          title: dto.title,
          location: request.location,
          quantity: request.quantity,
          status: 'open',
          createdBy: user.id,
        },
      });
      await tx.manpowerRequest.update({ where: { id }, data: { status: 'in_recruitment', updatedBy: user.id } });
      return v;
    });

    await this.audit.record({ tenantId: tid, actorId: user.id, action: 'manpowerRequest.convert', entityType: 'JobVacancy', entityId: vacancy.id, metadata: { manpowerRequestId: id } });
    return vacancy;
  }
}
