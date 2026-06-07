import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { buildMeta, normalizePagination, type Paginated } from '@kitalent/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotificationService } from '../notifications/notification.service';
import { ApprovalService } from '../approval/approval.service';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import type { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import type { ReviewLeaveDto } from './dto/review-leave.dto';
import type { QueryLeaveDto } from './dto/query-leave.dto';

const MS_PER_DAY = 86_400_000;

@Injectable()
export class LeavesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationService,
    private readonly approvals: ApprovalService,
  ) {}

  private requireTenant(tenantId: string | null): string {
    if (!tenantId) throw new ForbiddenException('A tenant context is required');
    return tenantId;
  }

  async create(user: AuthenticatedUser, dto: CreateLeaveRequestDto) {
    const tid = this.requireTenant(user.tenantId);

    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);
    if (end < start) throw new BadRequestException('endDate must be on or after startDate');
    const totalDays = Math.floor((end.getTime() - start.getTime()) / MS_PER_DAY) + 1;

    // Validate references belong to the tenant.
    const [employee, leaveType] = await Promise.all([
      this.prisma.employee.findFirst({ where: { id: dto.employeeId, tenantId: tid, deletedAt: null }, select: { id: true } }),
      this.prisma.leaveType.findFirst({ where: { id: dto.leaveTypeId, tenantId: tid, deletedAt: null }, select: { id: true } }),
    ]);
    if (!employee) throw new NotFoundException('Employee not found in this tenant');
    if (!leaveType) throw new NotFoundException('Leave type not found in this tenant');

    const request = await this.prisma.leaveRequest.create({
      data: {
        tenantId: tid,
        employeeId: dto.employeeId,
        leaveTypeId: dto.leaveTypeId,
        startDate: start,
        endDate: end,
        totalDays,
        reason: dto.reason,
        attachmentKey: dto.attachmentKey,
        status: 'submitted',
        createdBy: user.id,
      },
    });
    await this.audit.record({
      tenantId: tid,
      actorId: user.id,
      action: 'leave.create',
      entityType: 'LeaveRequest',
      entityId: request.id,
    });

    // Route through the tiered approval workflow if one is configured for leave
    // (PRD §10.27); otherwise the inline approve/reject endpoints handle it.
    const instance = await this.approvals.startForModule({
      tenantId: tid,
      module: 'leave',
      entityId: request.id,
      subjectEmployeeId: dto.employeeId,
      amount: totalDays,
      requestedBy: user.id,
    });
    if (instance) {
      return this.prisma.leaveRequest.update({ where: { id: request.id }, data: { status: 'waiting_approval' } });
    }
    return request;
  }

  /** Active leave types for the request form (PRD §10.14). */
  listTypes(tenantId: string | null) {
    const tid = this.requireTenant(tenantId);
    return this.prisma.leaveType.findMany({
      where: { tenantId: tid, deletedAt: null, isActive: true },
      orderBy: { name: 'asc' },
      select: { id: true, code: true, name: true, isPaid: true, defaultQuota: true },
    });
  }

  async list(tenantId: string | null, query: QueryLeaveDto): Promise<Paginated<unknown>> {
    const tid = this.requireTenant(tenantId);
    const { page, pageSize } = normalizePagination(query);

    const where: Prisma.LeaveRequestWhereInput = {
      tenantId: tid,
      deletedAt: null,
      ...(query.status ? { status: query.status as never } : {}),
      ...(query.employeeId ? { employeeId: query.employeeId } : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.leaveRequest.findMany({
        where,
        orderBy: { createdAt: query.sortOrder },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.leaveRequest.count({ where }),
    ]);

    return { data, meta: buildMeta(page, pageSize, total) };
  }

  private async loadPending(tenantId: string, id: string) {
    const request = await this.prisma.leaveRequest.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!request) throw new NotFoundException('Leave request not found');
    // 'waiting_approval' means a tiered workflow owns it — approve via /approvals.
    if (request.status !== 'submitted') {
      throw new BadRequestException(
        request.status === 'waiting_approval'
          ? 'This request is under a multi-step approval workflow; act via the approval inbox'
          : `Cannot review a request in status "${request.status}"`,
      );
    }
    return request;
  }

  async approve(user: AuthenticatedUser, id: string) {
    const tid = this.requireTenant(user.tenantId);
    const pending = await this.loadPending(tid, id);
    const request = await this.prisma.leaveRequest.update({
      where: { id },
      data: { status: 'approved', approvedBy: user.id, approvedAt: new Date(), updatedBy: user.id },
    });
    await this.audit.record({
      tenantId: tid,
      actorId: user.id,
      action: 'leave.approve',
      entityType: 'LeaveRequest',
      entityId: id,
    });
    // Notify the submitter (PRD §10.28).
    if (pending.createdBy) {
      await this.notifications.notify({
        tenantId: tid,
        recipientUserId: pending.createdBy,
        event: 'leave.approved',
        title: 'Pengajuan cuti disetujui',
        body: `Cuti ${pending.totalDays} hari Anda telah disetujui.`,
        data: { leaveRequestId: id },
      });
    }
    return request;
  }

  async reject(user: AuthenticatedUser, id: string, dto: ReviewLeaveDto) {
    const tid = this.requireTenant(user.tenantId);
    if (!dto.reason) throw new BadRequestException('A reason is required to reject');
    const pending = await this.loadPending(tid, id);
    const request = await this.prisma.leaveRequest.update({
      where: { id },
      data: { status: 'rejected', rejectReason: dto.reason, approvedBy: user.id, approvedAt: new Date(), updatedBy: user.id },
    });
    await this.audit.record({
      tenantId: tid,
      actorId: user.id,
      action: 'leave.reject',
      entityType: 'LeaveRequest',
      entityId: id,
      metadata: { reason: dto.reason },
    });
    if (pending.createdBy) {
      await this.notifications.notify({
        tenantId: tid,
        recipientUserId: pending.createdBy,
        event: 'leave.rejected',
        title: 'Pengajuan cuti ditolak',
        body: dto.reason,
        data: { leaveRequestId: id },
      });
    }
    return request;
  }
}
