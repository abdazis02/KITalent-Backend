import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { buildMeta, normalizePagination, type Paginated } from '@kitalent/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ApprovalService } from '../approval/approval.service';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import type { CreateReimbursementDto } from './dto/create-reimbursement.dto';
import type { QueryReimbursementDto, RejectReimbursementDto } from './dto/query-reimbursement.dto';

@Injectable()
export class ReimbursementsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly approvals: ApprovalService,
  ) {}

  private requireTenant(tenantId: string | null): string {
    if (!tenantId) throw new ForbiddenException('A tenant context is required');
    return tenantId;
  }

  async create(user: AuthenticatedUser, dto: CreateReimbursementDto) {
    const tid = this.requireTenant(user.tenantId);
    const employee = await this.prisma.employee.findFirst({ where: { id: dto.employeeId, tenantId: tid, deletedAt: null }, select: { id: true } });
    if (!employee) throw new NotFoundException('Employee not found in this tenant');

    const reimbursement = await this.prisma.reimbursement.create({
      data: { tenantId: tid, employeeId: dto.employeeId, category: dto.category, title: dto.title, amount: dto.amount, receiptKey: dto.receiptKey, status: 'submitted', createdBy: user.id },
    });
    await this.audit.record({ tenantId: tid, actorId: user.id, action: 'reimbursement.create', entityType: 'Reimbursement', entityId: reimbursement.id });

    const instance = await this.approvals.startForModule({ tenantId: tid, module: 'reimbursement', entityId: reimbursement.id, subjectEmployeeId: dto.employeeId, amount: dto.amount, requestedBy: user.id });
    if (instance) {
      return this.prisma.reimbursement.update({ where: { id: reimbursement.id }, data: { status: 'waiting_approval' } });
    }
    return reimbursement;
  }

  async list(tenantId: string | null, query: QueryReimbursementDto): Promise<Paginated<unknown>> {
    const tid = this.requireTenant(tenantId);
    const { page, pageSize } = normalizePagination(query);
    const where: Prisma.ReimbursementWhereInput = {
      tenantId: tid,
      deletedAt: null,
      ...(query.status ? { status: query.status as never } : {}),
      ...(query.employeeId ? { employeeId: query.employeeId } : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.reimbursement.findMany({ where, orderBy: { createdAt: query.sortOrder }, skip: (page - 1) * pageSize, take: pageSize }),
      this.prisma.reimbursement.count({ where }),
    ]);
    return { data, meta: buildMeta(page, pageSize, total) };
  }

  private async load(tenantId: string, id: string) {
    const r = await this.prisma.reimbursement.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!r) throw new NotFoundException('Reimbursement not found');
    return r;
  }

  async approve(user: AuthenticatedUser, id: string) {
    const tid = this.requireTenant(user.tenantId);
    const r = await this.load(tid, id);
    if (r.status !== 'submitted') throw new BadRequestException(`Cannot approve in status "${r.status}"`);
    const updated = await this.prisma.reimbursement.update({ where: { id }, data: { status: 'approved', approvedBy: user.id, approvedAt: new Date(), updatedBy: user.id } });
    await this.audit.record({ tenantId: tid, actorId: user.id, action: 'reimbursement.approve', entityType: 'Reimbursement', entityId: id });
    return updated;
  }

  async reject(user: AuthenticatedUser, id: string, dto: RejectReimbursementDto) {
    const tid = this.requireTenant(user.tenantId);
    if (!dto.reason) throw new BadRequestException('A reason is required to reject');
    const r = await this.load(tid, id);
    if (r.status !== 'submitted') throw new BadRequestException(`Cannot reject in status "${r.status}"`);
    const updated = await this.prisma.reimbursement.update({ where: { id }, data: { status: 'rejected', rejectReason: dto.reason, updatedBy: user.id } });
    await this.audit.record({ tenantId: tid, actorId: user.id, action: 'reimbursement.reject', entityType: 'Reimbursement', entityId: id, metadata: { reason: dto.reason } });
    return updated;
  }

  /** Finance marks an approved reimbursement as paid (PRD §10.19). */
  async pay(user: AuthenticatedUser, id: string) {
    const tid = this.requireTenant(user.tenantId);
    const r = await this.load(tid, id);
    if (r.status !== 'approved') throw new BadRequestException('Only an approved reimbursement can be paid');
    const updated = await this.prisma.reimbursement.update({ where: { id }, data: { status: 'paid', paidAt: new Date(), updatedBy: user.id } });
    await this.audit.record({ tenantId: tid, actorId: user.id, action: 'reimbursement.pay', entityType: 'Reimbursement', entityId: id });
    return updated;
  }
}
