import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { buildMeta, normalizePagination, type Paginated } from '@kitalent/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import type { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import type { CreateShiftDto } from './dto/create-shift.dto';
import type { UpdateShiftDto } from './dto/update-shift.dto';

@Injectable()
export class ShiftsService {
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
    const where: Prisma.ShiftWhereInput = {
      tenantId: tid,
      deletedAt: null,
      ...(query.search
        ? { OR: [{ name: { contains: query.search, mode: 'insensitive' } }, { code: { contains: query.search, mode: 'insensitive' } }] }
        : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.shift.findMany({ where, orderBy: { code: 'asc' }, skip: (page - 1) * pageSize, take: pageSize }),
      this.prisma.shift.count({ where }),
    ]);
    return { data, meta: buildMeta(page, pageSize, total) };
  }

  async findOne(tenantId: string | null, id: string) {
    const tid = this.requireTenant(tenantId);
    const shift = await this.prisma.shift.findFirst({ where: { id, tenantId: tid, deletedAt: null } });
    if (!shift) throw new NotFoundException('Shift not found');
    return shift;
  }

  async create(user: AuthenticatedUser, dto: CreateShiftDto) {
    const tid = this.requireTenant(user.tenantId);
    const shift = await this.prisma.shift.create({ data: { ...dto, tenantId: tid, createdBy: user.id } });
    await this.audit.record({ tenantId: tid, actorId: user.id, action: 'shift.create', entityType: 'Shift', entityId: shift.id });
    return shift;
  }

  async update(user: AuthenticatedUser, id: string, dto: UpdateShiftDto) {
    const tid = this.requireTenant(user.tenantId);
    await this.findOne(tid, id);
    const shift = await this.prisma.shift.update({ where: { id }, data: { ...dto, updatedBy: user.id } });
    await this.audit.record({ tenantId: tid, actorId: user.id, action: 'shift.update', entityType: 'Shift', entityId: id });
    return shift;
  }

  async remove(user: AuthenticatedUser, id: string) {
    const tid = this.requireTenant(user.tenantId);
    await this.findOne(tid, id);
    await this.prisma.shift.update({ where: { id }, data: { deletedAt: new Date(), updatedBy: user.id } });
    await this.audit.record({ tenantId: tid, actorId: user.id, action: 'shift.delete', entityType: 'Shift', entityId: id });
    return { id, deleted: true };
  }
}
