import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { buildMeta, normalizePagination, type Paginated } from '@kitalent/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ApprovalService } from '../approval/approval.service';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import type { CreateOvertimeDto } from './dto/create-overtime.dto';
import type { QueryOvertimeDto, RejectOvertimeDto } from './dto/query-overtime.dto';

/** Minutes between two "HH:mm" times; if end ≤ start it is treated as crossing midnight. */
export function durationMinutes(start: string, end: string): number {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  let diff = eh * 60 + em - (sh * 60 + sm);
  if (diff <= 0) diff += 24 * 60;
  return diff;
}

@Injectable()
export class OvertimesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly approvals: ApprovalService,
  ) {}

  private requireTenant(tenantId: string | null): string {
    if (!tenantId) throw new ForbiddenException('A tenant context is required');
    return tenantId;
  }

  async create(user: AuthenticatedUser, dto: CreateOvertimeDto) {
    const tid = this.requireTenant(user.tenantId);
    const employee = await this.prisma.employee.findFirst({
      where: { id: dto.employeeId, tenantId: tid, deletedAt: null },
      select: { id: true },
    });
    if (!employee) throw new NotFoundException('Employee not found in this tenant');

    const minutes = durationMinutes(dto.startTime, dto.endTime);
    const request = await this.prisma.overtimeRequest.create({
      data: {
        tenantId: tid,
        employeeId: dto.employeeId,
        date: new Date(dto.date),
        startTime: dto.startTime,
        endTime: dto.endTime,
        durationMinutes: minutes,
        reason: dto.reason,
        attachmentKey: dto.attachmentKey,
        status: 'submitted',
        createdBy: user.id,
      },
    });
    await this.audit.record({ tenantId: tid, actorId: user.id, action: 'overtime.create', entityType: 'OvertimeRequest', entityId: request.id });

    const instance = await this.approvals.startForModule({ tenantId: tid, module: 'overtime', entityId: request.id, subjectEmployeeId: dto.employeeId, amount: minutes, requestedBy: user.id });
    if (instance) {
      return this.prisma.overtimeRequest.update({ where: { id: request.id }, data: { status: 'waiting_approval' } });
    }
    return request;
  }

  async list(tenantId: string | null, query: QueryOvertimeDto): Promise<Paginated<unknown>> {
    const tid = this.requireTenant(tenantId);
    const { page, pageSize } = normalizePagination(query);
    const where: Prisma.OvertimeRequestWhereInput = {
      tenantId: tid,
      deletedAt: null,
      ...(query.status ? { status: query.status as never } : {}),
      ...(query.employeeId ? { employeeId: query.employeeId } : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.overtimeRequest.findMany({ where, orderBy: { date: query.sortOrder }, skip: (page - 1) * pageSize, take: pageSize }),
      this.prisma.overtimeRequest.count({ where }),
    ]);
    return { data, meta: buildMeta(page, pageSize, total) };
  }

  private async loadPending(tenantId: string, id: string) {
    const request = await this.prisma.overtimeRequest.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!request) throw new NotFoundException('Overtime request not found');
    if (request.status !== 'submitted') {
      throw new BadRequestException(`Cannot review a request in status "${request.status}"`);
    }
    return request;
  }

  async approve(user: AuthenticatedUser, id: string) {
    const tid = this.requireTenant(user.tenantId);
    await this.loadPending(tid, id);
    const request = await this.prisma.overtimeRequest.update({
      where: { id },
      data: { status: 'approved', approvedBy: user.id, approvedAt: new Date(), updatedBy: user.id },
    });
    await this.audit.record({ tenantId: tid, actorId: user.id, action: 'overtime.approve', entityType: 'OvertimeRequest', entityId: id });
    return request;
  }

  async reject(user: AuthenticatedUser, id: string, dto: RejectOvertimeDto) {
    const tid = this.requireTenant(user.tenantId);
    if (!dto.reason) throw new BadRequestException('A reason is required to reject');
    await this.loadPending(tid, id);
    const request = await this.prisma.overtimeRequest.update({
      where: { id },
      data: { status: 'rejected', rejectReason: dto.reason, approvedBy: user.id, approvedAt: new Date(), updatedBy: user.id },
    });
    await this.audit.record({ tenantId: tid, actorId: user.id, action: 'overtime.reject', entityType: 'OvertimeRequest', entityId: id, metadata: { reason: dto.reason } });
    return request;
  }
}
