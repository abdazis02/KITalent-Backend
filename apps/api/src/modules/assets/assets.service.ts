import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { buildMeta, normalizePagination, type Paginated } from '@kitalent/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import type { AssignAssetDto, CreateAssetDto, QueryAssetDto, ReturnAssetDto } from './dto/asset.dto';

@Injectable()
export class AssetsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  private requireTenant(tenantId: string | null): string {
    if (!tenantId) throw new ForbiddenException('A tenant context is required');
    return tenantId;
  }

  async create(user: AuthenticatedUser, dto: CreateAssetDto) {
    const tid = this.requireTenant(user.tenantId);
    const asset = await this.prisma.asset.create({ data: { ...dto, tenantId: tid, status: 'available', createdBy: user.id } });
    await this.audit.record({ tenantId: tid, actorId: user.id, action: 'asset.create', entityType: 'Asset', entityId: asset.id });
    return asset;
  }

  async list(tenantId: string | null, query: QueryAssetDto): Promise<Paginated<unknown>> {
    const tid = this.requireTenant(tenantId);
    const { page, pageSize } = normalizePagination(query);
    const where: Prisma.AssetWhereInput = {
      tenantId: tid,
      deletedAt: null,
      ...(query.status ? { status: query.status as never } : {}),
      ...(query.category ? { category: query.category } : {}),
      ...(query.employeeId ? { currentEmployeeId: query.employeeId } : {}),
      ...(query.search ? { OR: [{ name: { contains: query.search, mode: 'insensitive' } }, { code: { contains: query.search, mode: 'insensitive' } }] } : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.asset.findMany({ where, orderBy: { code: 'asc' }, skip: (page - 1) * pageSize, take: pageSize }),
      this.prisma.asset.count({ where }),
    ]);
    return { data, meta: buildMeta(page, pageSize, total) };
  }

  private async load(tenantId: string, id: string) {
    const asset = await this.prisma.asset.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!asset) throw new NotFoundException('Asset not found');
    return asset;
  }

  findOne(tenantId: string | null, id: string) {
    return this.load(this.requireTenant(tenantId), id);
  }

  /** Assign an available asset to an employee (PRD §10.24). */
  async assign(user: AuthenticatedUser, id: string, dto: AssignAssetDto) {
    const tid = this.requireTenant(user.tenantId);
    const asset = await this.load(tid, id);
    if (asset.status !== 'available' && asset.status !== 'returned') {
      throw new BadRequestException(`Asset is not available (status: ${asset.status})`);
    }
    const employee = await this.prisma.employee.findFirst({ where: { id: dto.employeeId, tenantId: tid, deletedAt: null }, select: { id: true } });
    if (!employee) throw new NotFoundException('Employee not found in this tenant');

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.assetAssignment.create({ data: { tenantId: tid, assetId: id, employeeId: dto.employeeId, notes: dto.notes, createdBy: user.id } });
      return tx.asset.update({ where: { id }, data: { status: 'assigned', currentEmployeeId: dto.employeeId, updatedBy: user.id } });
    });
    await this.audit.record({ tenantId: tid, actorId: user.id, action: 'asset.assign', entityType: 'Asset', entityId: id, metadata: { employeeId: dto.employeeId } });
    return updated;
  }

  /** Return an assigned asset; condition decides the resulting status. */
  async return(user: AuthenticatedUser, id: string, dto: ReturnAssetDto) {
    const tid = this.requireTenant(user.tenantId);
    const asset = await this.load(tid, id);
    if (asset.status !== 'assigned') throw new BadRequestException('Only an assigned asset can be returned');

    const condition = dto.condition ?? 'good';
    const newStatus = condition === 'damaged' ? 'damaged' : condition === 'lost' ? 'lost' : 'available';

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.assetAssignment.updateMany({
        where: { assetId: id, returnedAt: null },
        data: { returnedAt: new Date(), returnCondition: condition, notes: dto.notes },
      });
      return tx.asset.update({ where: { id }, data: { status: newStatus, currentEmployeeId: null, updatedBy: user.id } });
    });
    await this.audit.record({ tenantId: tid, actorId: user.id, action: 'asset.return', entityType: 'Asset', entityId: id, metadata: { condition } });
    return updated;
  }

  async history(tenantId: string | null, id: string) {
    const tid = this.requireTenant(tenantId);
    await this.load(tid, id);
    return this.prisma.assetAssignment.findMany({
      where: { assetId: id, tenantId: tid },
      include: { employee: { select: { employeeNo: true, fullName: true } } },
      orderBy: { assignedAt: 'desc' },
    });
  }
}
