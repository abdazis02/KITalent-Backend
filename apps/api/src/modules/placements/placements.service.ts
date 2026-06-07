import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { buildMeta, normalizePagination, type Paginated } from '@kitalent/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ApprovalService } from '../approval/approval.service';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import type { CreatePlacementDto } from './dto/create-placement.dto';
import type { QueryPlacementDto } from './dto/query-placement.dto';

@Injectable()
export class PlacementsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly approvals: ApprovalService,
  ) {}

  private requireTenant(tenantId: string | null): string {
    if (!tenantId) throw new ForbiddenException('A tenant context is required');
    return tenantId;
  }

  /** Submit a draft placement into the tiered approval workflow (PRD §10.27). */
  async submitForApproval(user: AuthenticatedUser, id: string) {
    const tid = this.requireTenant(user.tenantId);
    const placement = await this.findOne(tid, id);
    if (placement.status !== 'draft') throw new BadRequestException(`Only a draft placement can be submitted (status "${placement.status}")`);
    const instance = await this.approvals.startForModule({ tenantId: tid, module: 'placement', entityId: id, subjectEmployeeId: placement.employeeId, requestedBy: user.id });
    if (!instance) return { ...placement, approval: null as unknown, note: 'No active approval workflow — use activate directly' };
    const updated = await this.prisma.placement.update({ where: { id }, data: { status: 'waiting_approval', updatedBy: user.id } });
    await this.audit.record({ tenantId: tid, actorId: user.id, action: 'placement.submit', entityType: 'Placement', entityId: id });
    return { ...updated, approval: instance };
  }

  async create(user: AuthenticatedUser, dto: CreatePlacementDto) {
    const tid = this.requireTenant(user.tenantId);

    await this.assertExists(this.prisma.employee.findFirst({ where: { id: dto.employeeId, tenantId: tid, deletedAt: null }, select: { id: true } }), 'Employee');
    await this.assertExists(this.prisma.client.findFirst({ where: { id: dto.clientId, tenantId: tid, deletedAt: null }, select: { id: true } }), 'Client');
    if (dto.shiftId) await this.assertExists(this.prisma.shift.findFirst({ where: { id: dto.shiftId, tenantId: tid, deletedAt: null }, select: { id: true } }), 'Shift');
    if (dto.contractId) await this.assertExists(this.prisma.contract.findFirst({ where: { id: dto.contractId, tenantId: tid, deletedAt: null }, select: { id: true } }), 'Contract');

    const placement = await this.prisma.placement.create({
      data: {
        tenantId: tid,
        employeeId: dto.employeeId,
        clientId: dto.clientId,
        contractId: dto.contractId,
        shiftId: dto.shiftId,
        position: dto.position,
        location: dto.location,
        supervisorId: dto.supervisorId,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        notes: dto.notes,
        status: 'draft',
        createdBy: user.id,
      },
    });
    await this.audit.record({ tenantId: tid, actorId: user.id, action: 'placement.create', entityType: 'Placement', entityId: placement.id });
    return placement;
  }

  async list(tenantId: string | null, query: QueryPlacementDto): Promise<Paginated<unknown>> {
    const tid = this.requireTenant(tenantId);
    const { page, pageSize } = normalizePagination(query);
    const where: Prisma.PlacementWhereInput = {
      tenantId: tid,
      deletedAt: null,
      ...(query.status ? { status: query.status as never } : {}),
      ...(query.employeeId ? { employeeId: query.employeeId } : {}),
      ...(query.clientId ? { clientId: query.clientId } : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.placement.findMany({
        where,
        include: {
          employee: { select: { employeeNo: true, fullName: true } },
          client: { select: { code: true, name: true } },
        },
        orderBy: { startDate: query.sortOrder },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.placement.count({ where }),
    ]);
    return { data, meta: buildMeta(page, pageSize, total) };
  }

  async findOne(tenantId: string | null, id: string) {
    const tid = this.requireTenant(tenantId);
    const placement = await this.prisma.placement.findFirst({
      where: { id, tenantId: tid, deletedAt: null },
      include: { employee: { select: { employeeNo: true, fullName: true } }, client: { select: { code: true, name: true } }, shift: true },
    });
    if (!placement) throw new NotFoundException('Placement not found');
    return placement;
  }

  /** Activate a placement (draft/waiting → active). */
  async activate(user: AuthenticatedUser, id: string) {
    const tid = this.requireTenant(user.tenantId);
    const placement = await this.findOne(tid, id);
    if (!['draft', 'waiting_approval'].includes(placement.status)) {
      throw new BadRequestException(`Cannot activate a placement in status "${placement.status}"`);
    }
    return this.transition(user, tid, id, 'active', 'placement.activate');
  }

  async complete(user: AuthenticatedUser, id: string) {
    const tid = this.requireTenant(user.tenantId);
    const placement = await this.findOne(tid, id);
    if (!['active', 'on_hold'].includes(placement.status)) {
      throw new BadRequestException(`Cannot complete a placement in status "${placement.status}"`);
    }
    return this.transition(user, tid, id, 'completed', 'placement.complete');
  }

  async requestReplacement(user: AuthenticatedUser, id: string) {
    const tid = this.requireTenant(user.tenantId);
    const placement = await this.findOne(tid, id);
    if (placement.status !== 'active') {
      throw new BadRequestException('Only an active placement can request replacement');
    }
    return this.transition(user, tid, id, 'replacement_requested', 'placement.replacement');
  }

  async remove(user: AuthenticatedUser, id: string) {
    const tid = this.requireTenant(user.tenantId);
    await this.findOne(tid, id);
    await this.prisma.placement.update({ where: { id }, data: { deletedAt: new Date(), deletedBy: user.id } });
    await this.audit.record({ tenantId: tid, actorId: user.id, action: 'placement.delete', entityType: 'Placement', entityId: id });
    return { id, deleted: true };
  }

  private async transition(user: AuthenticatedUser, tenantId: string, id: string, status: string, action: string) {
    const updated = await this.prisma.placement.update({ where: { id }, data: { status: status as never, updatedBy: user.id } });
    await this.audit.record({ tenantId, actorId: user.id, action, entityType: 'Placement', entityId: id });
    return updated;
  }

  private async assertExists<T>(query: Promise<T | null>, label: string) {
    if (!(await query)) throw new NotFoundException(`${label} not found in this tenant`);
  }
}
