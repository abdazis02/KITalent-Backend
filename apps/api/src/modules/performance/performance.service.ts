import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { buildMeta, normalizePagination, type Paginated } from '@kitalent/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import type { CreateReviewDto, PerformanceItemDto, QueryReviewDto } from './dto/create-review.dto';

/** Weighted average of KPI item scores, 0..100. */
export function weightedScore(items: PerformanceItemDto[]): number {
  const totalWeight = items.reduce((s, i) => s + (i.weight ?? 1), 0);
  if (totalWeight === 0) return 0;
  const weighted = items.reduce((s, i) => s + i.score * (i.weight ?? 1), 0);
  return Math.round(weighted / totalWeight);
}

@Injectable()
export class PerformanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  private requireTenant(tenantId: string | null): string {
    if (!tenantId) throw new ForbiddenException('A tenant context is required');
    return tenantId;
  }

  async create(user: AuthenticatedUser, dto: CreateReviewDto) {
    const tid = this.requireTenant(user.tenantId);
    const employee = await this.prisma.employee.findFirst({ where: { id: dto.employeeId, tenantId: tid, deletedAt: null }, select: { id: true } });
    if (!employee) throw new NotFoundException('Employee not found in this tenant');

    const overallScore = weightedScore(dto.items);
    const review = await this.prisma.performanceReview.create({
      data: {
        tenantId: tid,
        employeeId: dto.employeeId,
        reviewerId: user.id,
        period: dto.period,
        type: dto.type ?? 'supervisor',
        notes: dto.notes,
        overallScore,
        status: 'draft',
        createdBy: user.id,
        items: { create: dto.items.map((i) => ({ kpi: i.kpi, weight: i.weight ?? 1, score: i.score })) },
      },
      include: { items: true },
    });
    await this.audit.record({ tenantId: tid, actorId: user.id, action: 'performance.create', entityType: 'PerformanceReview', entityId: review.id });
    return review;
  }

  async list(tenantId: string | null, query: QueryReviewDto): Promise<Paginated<unknown>> {
    const tid = this.requireTenant(tenantId);
    const { page, pageSize } = normalizePagination(query);
    const where: Prisma.PerformanceReviewWhereInput = {
      tenantId: tid,
      deletedAt: null,
      ...(query.status ? { status: query.status as never } : {}),
      ...(query.employeeId ? { employeeId: query.employeeId } : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.performanceReview.findMany({ where, orderBy: { createdAt: query.sortOrder }, skip: (page - 1) * pageSize, take: pageSize }),
      this.prisma.performanceReview.count({ where }),
    ]);
    return { data, meta: buildMeta(page, pageSize, total) };
  }

  async findOne(tenantId: string | null, id: string) {
    const tid = this.requireTenant(tenantId);
    const review = await this.prisma.performanceReview.findFirst({ where: { id, tenantId: tid, deletedAt: null }, include: { items: true, employee: { select: { employeeNo: true, fullName: true } } } });
    if (!review) throw new NotFoundException('Performance review not found');
    return review;
  }

  private async transition(user: AuthenticatedUser, id: string, from: string[], to: string, action: string, extra: Prisma.PerformanceReviewUpdateInput = {}) {
    const tid = this.requireTenant(user.tenantId);
    const review = await this.findOne(tid, id);
    if (!from.includes(review.status)) throw new BadRequestException(`Cannot ${action} a review in status "${review.status}"`);
    const updated = await this.prisma.performanceReview.update({ where: { id }, data: { status: to as never, updatedBy: user.id, ...extra } });
    await this.audit.record({ tenantId: tid, actorId: user.id, action: `performance.${action}`, entityType: 'PerformanceReview', entityId: id });
    return updated;
  }

  submit(user: AuthenticatedUser, id: string) {
    return this.transition(user, id, ['draft', 'in_review'], 'submitted', 'submit');
  }

  approve(user: AuthenticatedUser, id: string) {
    return this.transition(user, id, ['submitted'], 'approved', 'approve');
  }

  publish(user: AuthenticatedUser, id: string) {
    return this.transition(user, id, ['approved'], 'published', 'publish', { publishedAt: new Date() });
  }
}
