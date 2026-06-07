import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { buildMeta, normalizePagination, type Paginated } from '@kitalent/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import type { CreateVacancyDto, QueryVacancyDto } from './dto/vacancy.dto';

@Injectable()
export class VacanciesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  private requireTenant(tenantId: string | null): string {
    if (!tenantId) throw new ForbiddenException('A tenant context is required');
    return tenantId;
  }

  async create(user: AuthenticatedUser, dto: CreateVacancyDto) {
    const tid = this.requireTenant(user.tenantId);
    if (dto.clientId) {
      const client = await this.prisma.client.findFirst({ where: { id: dto.clientId, tenantId: tid, deletedAt: null }, select: { id: true } });
      if (!client) throw new NotFoundException('Client not found in this tenant');
    }
    const vacancy = await this.prisma.jobVacancy.create({ data: { ...dto, tenantId: tid, status: 'draft', createdBy: user.id } });
    await this.audit.record({ tenantId: tid, actorId: user.id, action: 'vacancy.create', entityType: 'JobVacancy', entityId: vacancy.id });
    return vacancy;
  }

  async list(tenantId: string | null, query: QueryVacancyDto): Promise<Paginated<unknown>> {
    const tid = this.requireTenant(tenantId);
    const { page, pageSize } = normalizePagination(query);
    const where: Prisma.JobVacancyWhereInput = {
      tenantId: tid,
      deletedAt: null,
      ...(query.status ? { status: query.status as never } : {}),
      ...(query.search ? { OR: [{ title: { contains: query.search, mode: 'insensitive' } }, { code: { contains: query.search, mode: 'insensitive' } }] } : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.jobVacancy.findMany({ where, orderBy: { createdAt: query.sortOrder }, skip: (page - 1) * pageSize, take: pageSize }),
      this.prisma.jobVacancy.count({ where }),
    ]);
    return { data, meta: buildMeta(page, pageSize, total) };
  }

  async findOne(tenantId: string | null, id: string) {
    const tid = this.requireTenant(tenantId);
    const vacancy = await this.prisma.jobVacancy.findFirst({ where: { id, tenantId: tid, deletedAt: null }, include: { _count: { select: { candidates: true } } } });
    if (!vacancy) throw new NotFoundException('Vacancy not found');
    return vacancy;
  }

  async setStatus(user: AuthenticatedUser, id: string, status: 'open' | 'closed', action: string) {
    const tid = this.requireTenant(user.tenantId);
    const vacancy = await this.findOne(tid, id);
    if (status === 'open' && !['draft', 'on_hold', 'closed'].includes(vacancy.status)) {
      throw new BadRequestException(`Cannot open a vacancy in status "${vacancy.status}"`);
    }
    const updated = await this.prisma.jobVacancy.update({ where: { id }, data: { status, updatedBy: user.id } });
    await this.audit.record({ tenantId: tid, actorId: user.id, action, entityType: 'JobVacancy', entityId: id });
    return updated;
  }
}
