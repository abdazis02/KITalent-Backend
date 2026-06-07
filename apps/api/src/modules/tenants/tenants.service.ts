import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { buildMeta, normalizePagination, type Paginated } from '@kitalent/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import type { CreateTenantDto, QueryTenantDto, UpdateTenantDto } from './dto/tenant.dto';

/**
 * Platform-level tenant & subscription management (PRD §10.2). Unlike domain
 * modules this is NOT scoped to a single tenant — it administers all of them.
 */
@Injectable()
export class TenantsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list(query: QueryTenantDto): Promise<Paginated<unknown>> {
    const { page, pageSize } = normalizePagination(query);
    const where: Prisma.TenantWhereInput = {
      deletedAt: null,
      ...(query.status ? { status: query.status as never } : {}),
      ...(query.search ? { name: { contains: query.search, mode: 'insensitive' } } : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.tenant.findMany({ where, orderBy: { createdAt: query.sortOrder }, skip: (page - 1) * pageSize, take: pageSize }),
      this.prisma.tenant.count({ where }),
    ]);
    return { data, meta: buildMeta(page, pageSize, total) };
  }

  async findOne(id: string) {
    const tenant = await this.prisma.tenant.findFirst({ where: { id, deletedAt: null } });
    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }

  async create(user: AuthenticatedUser, dto: CreateTenantDto) {
    const tenant = await this.prisma.tenant.create({
      data: { name: dto.name, legalName: dto.legalName, mode: (dto.mode as never) ?? undefined, plan: (dto.plan as never) ?? undefined, defaultLocale: dto.defaultLocale ?? 'id-ID', status: 'trial', createdBy: user.id },
    });
    await this.audit.record({ tenantId: tenant.id, actorId: user.id, action: 'tenant.create', entityType: 'Tenant', entityId: tenant.id });
    return tenant;
  }

  async update(user: AuthenticatedUser, id: string, dto: UpdateTenantDto) {
    await this.findOne(id);
    const { isActive, ...rest } = dto;
    const tenant = await this.prisma.tenant.update({
      where: { id },
      data: {
        ...rest,
        mode: (dto.mode as never) ?? undefined,
        plan: (dto.plan as never) ?? undefined,
        status: (dto.status as never) ?? (isActive === false ? 'inactive' : undefined),
        featureFlags: (dto.featureFlags as object) ?? undefined,
        limits: (dto.limits as object) ?? undefined,
        updatedBy: user.id,
      },
    });
    await this.audit.record({ tenantId: id, actorId: user.id, action: 'tenant.update', entityType: 'Tenant', entityId: id });
    return tenant;
  }
}
