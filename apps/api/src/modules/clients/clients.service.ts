import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { buildMeta, normalizePagination, type Paginated } from '@kitalent/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import type { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import type { CreateClientDto } from './dto/create-client.dto';
import type { UpdateClientDto } from './dto/update-client.dto';

@Injectable()
export class ClientsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  private requireTenant(tenantId: string | null): string {
    if (!tenantId) throw new ForbiddenException('A tenant context is required');
    return tenantId;
  }

  async list(tenantId: string | null, query: PaginationQueryDto): Promise<Paginated<unknown>> {
    const tid = this.requireTenant(tenantId);
    const { page, pageSize } = normalizePagination(query);

    const where: Prisma.ClientWhereInput = {
      tenantId: tid,
      deletedAt: null,
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { code: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.client.findMany({
        where,
        orderBy: { [query.sortBy ?? 'createdAt']: query.sortOrder },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.client.count({ where }),
    ]);

    return { data, meta: buildMeta(page, pageSize, total) };
  }

  async findOne(tenantId: string | null, id: string) {
    const tid = this.requireTenant(tenantId);
    const client = await this.prisma.client.findFirst({
      where: { id, tenantId: tid, deletedAt: null },
    });
    if (!client) throw new NotFoundException('Client not found');
    return client;
  }

  async create(user: AuthenticatedUser, dto: CreateClientDto) {
    const tid = this.requireTenant(user.tenantId);
    const client = await this.prisma.client.create({
      data: { ...dto, tenantId: tid, createdBy: user.id },
    });
    await this.audit.record({
      tenantId: tid,
      actorId: user.id,
      action: 'client.create',
      entityType: 'Client',
      entityId: client.id,
    });
    return client;
  }

  async update(user: AuthenticatedUser, id: string, dto: UpdateClientDto) {
    const tid = this.requireTenant(user.tenantId);
    await this.findOne(tid, id);
    const client = await this.prisma.client.update({
      where: { id },
      data: { ...dto, updatedBy: user.id },
    });
    await this.audit.record({
      tenantId: tid,
      actorId: user.id,
      action: 'client.update',
      entityType: 'Client',
      entityId: id,
    });
    return client;
  }

  async remove(user: AuthenticatedUser, id: string) {
    const tid = this.requireTenant(user.tenantId);
    await this.findOne(tid, id);
    await this.prisma.client.update({
      where: { id },
      data: { deletedAt: new Date(), deletedBy: user.id },
    });
    await this.audit.record({
      tenantId: tid,
      actorId: user.id,
      action: 'client.delete',
      entityType: 'Client',
      entityId: id,
    });
    return { id, deleted: true };
  }
}
