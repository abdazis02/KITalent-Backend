import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotificationService } from '../notifications/notification.service';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import type { ActDto, CreateWorkflowDto, StartInstanceDto } from './dto/approval.dto';

interface ResolvedApprover {
  userId?: string | null;
  roleKey?: string | null;
}

export interface StartForModuleInput {
  module: string;
  entityId: string;
  subjectEmployeeId?: string;
  amount?: number;
  requestedBy: string;
  tenantId: string;
}

/**
 * Configurable, hierarchical, multi-step approval engine (PRD §10.27, §17.15).
 * Steps resolve their approver from the org hierarchy (direct supervisor,
 * department head) or RBAC (role/user), support amount-based conditions, and on
 * completion drive the source record's status.
 */
@Injectable()
export class ApprovalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationService,
  ) {}

  private requireTenant(tenantId: string | null): string {
    if (!tenantId) throw new ForbiddenException('A tenant context is required');
    return tenantId;
  }

  // ---- Workflow configuration ------------------------------------------
  async createWorkflow(user: AuthenticatedUser, dto: CreateWorkflowDto) {
    const tid = this.requireTenant(user.tenantId);
    const workflow = await this.prisma.approvalWorkflow.create({
      data: {
        tenantId: tid,
        module: dto.module,
        name: dto.name,
        createdBy: user.id,
        stepTemplates: {
          create: [...dto.steps]
            .sort((a, b) => a.stepOrder - b.stepOrder)
            .map((s) => ({
              tenantId: tid,
              stepOrder: s.stepOrder,
              name: s.name,
              approverType: s.approverType as never,
              approverRoleKey: s.approverRoleKey,
              approverUserId: s.approverUserId,
              minAmount: s.minAmount ?? 0,
              isRequired: s.isRequired ?? true,
            })),
        },
      },
      include: { stepTemplates: { orderBy: { stepOrder: 'asc' } } },
    });
    await this.audit.record({ tenantId: tid, actorId: user.id, action: 'approval.workflow.create', entityType: 'ApprovalWorkflow', entityId: workflow.id });
    return workflow;
  }

  listWorkflows(tenantId: string | null, module?: string) {
    const tid = this.requireTenant(tenantId);
    return this.prisma.approvalWorkflow.findMany({
      where: { tenantId: tid, deletedAt: null, ...(module ? { module } : {}) },
      include: { stepTemplates: { orderBy: { stepOrder: 'asc' } } },
      orderBy: { module: 'asc' },
      take: 500,
    });
  }

  // ---- Approver resolution (the hierarchy logic) -----------------------
  private async resolveApprover(tenantId: string, approverType: string, subjectEmployeeId: string | null, approverRoleKey?: string | null, approverUserId?: string | null): Promise<ResolvedApprover> {
    switch (approverType) {
      case 'user':
        return { userId: approverUserId ?? null };
      case 'role':
        return { roleKey: approverRoleKey ?? null };
      case 'hr':
        return { roleKey: approverRoleKey ?? 'hr_manager' };
      case 'finance':
        return { roleKey: approverRoleKey ?? 'finance_manager' };
      case 'client':
        return { roleKey: approverRoleKey ?? 'client_approver' };
      case 'supervisor': {
        if (!subjectEmployeeId) return { roleKey: 'hr_manager' };
        const emp = await this.prisma.employee.findFirst({ where: { id: subjectEmployeeId, tenantId }, select: { supervisorId: true } });
        if (!emp?.supervisorId) return { roleKey: 'hr_manager' }; // fallback when no supervisor set
        const sup = await this.prisma.employee.findFirst({ where: { id: emp.supervisorId, tenantId }, select: { userId: true } });
        return { userId: sup?.userId ?? null, roleKey: sup?.userId ? null : 'hr_manager' };
      }
      case 'department_head': {
        if (!subjectEmployeeId) return { roleKey: 'hr_manager' };
        const emp = await this.prisma.employee.findFirst({ where: { id: subjectEmployeeId, tenantId }, select: { departmentId: true } });
        if (!emp?.departmentId) return { roleKey: 'hr_manager' };
        const dept = await this.prisma.department.findFirst({ where: { id: emp.departmentId, tenantId }, select: { headEmployeeId: true } });
        if (!dept?.headEmployeeId) return { roleKey: 'hr_manager' };
        const head = await this.prisma.employee.findFirst({ where: { id: dept.headEmployeeId, tenantId }, select: { userId: true } });
        return { userId: head?.userId ?? null, roleKey: head?.userId ? null : 'hr_manager' };
      }
      default:
        return { roleKey: approverRoleKey ?? null };
    }
  }

  // ---- Start (module-driven) -------------------------------------------
  /** Returns the active workflow for a module, or null (caller falls back to inline approval). */
  async activeWorkflow(tenantId: string, module: string) {
    // Newest active workflow that actually has steps wins (ignore stale/empty ones).
    return this.prisma.approvalWorkflow.findFirst({
      where: { tenantId, module, isActive: true, deletedAt: null, stepTemplates: { some: {} } },
      include: { stepTemplates: { orderBy: { stepOrder: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Start an approval instance for a record. Skips steps whose minAmount exceeds
   * the request amount (conditional). If no step applies, auto-completes.
   * Returns the instance, or null if no active workflow exists for the module.
   */
  async startForModule(input: StartForModuleInput) {
    const workflow = await this.activeWorkflow(input.tenantId, input.module);
    if (!workflow) return null;

    const amount = input.amount ?? 0;
    const applicable = workflow.stepTemplates.filter((s) => amount >= s.minAmount);

    if (applicable.length === 0) {
      // No step applies → auto-approved.
      await this.completeSource(input.tenantId, input.module, input.entityId, 'approved', input.requestedBy ?? null);
      return null;
    }

    const instance = await this.prisma.$transaction(async (tx) => {
      const inst = await tx.approvalInstance.create({
        data: {
          tenantId: input.tenantId,
          workflowId: workflow.id,
          module: input.module,
          entityId: input.entityId,
          subjectEmployeeId: input.subjectEmployeeId,
          amount,
          status: 'pending',
          currentStep: applicable[0].stepOrder,
          requestedBy: input.requestedBy,
          createdBy: input.requestedBy,
        },
      });
      for (const s of applicable) {
        const resolved = await this.resolveApprover(input.tenantId, s.approverType, input.subjectEmployeeId ?? null, s.approverRoleKey, s.approverUserId);
        await tx.approvalStepRecord.create({
          data: {
            instanceId: inst.id,
            stepOrder: s.stepOrder,
            name: s.name,
            approverType: s.approverType,
            approverRoleKey: resolved.roleKey ?? null,
            resolvedApproverUserId: resolved.userId ?? null,
            status: 'pending',
          },
        });
      }
      return inst;
    });

    // Notify the first approver if it resolves to a concrete user.
    const firstStep = await this.prisma.approvalStepRecord.findFirst({ where: { instanceId: instance.id }, orderBy: { stepOrder: 'asc' } });
    if (firstStep?.resolvedApproverUserId) {
      await this.notifications.notify({ tenantId: input.tenantId, recipientUserId: firstStep.resolvedApproverUserId, event: `${input.module}.approval.pending`, title: 'Persetujuan menunggu Anda', body: `Ada ${input.module} yang menunggu persetujuan.`, data: { instanceId: instance.id, module: input.module } });
    }

    await this.audit.record({ tenantId: input.tenantId, actorId: input.requestedBy, action: 'approval.start', entityType: 'ApprovalInstance', entityId: instance.id, metadata: { module: input.module, entityId: input.entityId } });
    return this.getInstance(input.tenantId, instance.id);
  }

  /** Manual start via the API. */
  async start(user: AuthenticatedUser, dto: StartInstanceDto) {
    const tid = this.requireTenant(user.tenantId);
    return this.startForModule({ tenantId: tid, module: dto.module, entityId: dto.entityId, subjectEmployeeId: dto.subjectEmployeeId, amount: dto.amount, requestedBy: user.id });
  }

  async getInstance(tenantId: string | null, id: string) {
    const tid = this.requireTenant(tenantId);
    const instance = await this.prisma.approvalInstance.findFirst({
      where: { id, tenantId: tid },
      include: { steps: { orderBy: { stepOrder: 'asc' } }, workflow: { select: { name: true, module: true } } },
    });
    if (!instance) throw new NotFoundException('Approval instance not found');
    return instance;
  }

  /** Approval inbox: instances with a pending step assigned to the current user (by resolved user or role). */
  async myPending(user: AuthenticatedUser) {
    const tid = this.requireTenant(user.tenantId);
    const instances = await this.prisma.approvalInstance.findMany({
      where: { tenantId: tid, status: 'pending' },
      include: { steps: { orderBy: { stepOrder: 'asc' } }, workflow: { select: { name: true, module: true } } },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    return instances.filter((inst) => {
      const current = inst.steps.find((s) => s.status === 'pending');
      if (!current) return false;
      if (current.resolvedApproverUserId) return current.resolvedApproverUserId === user.id;
      if (current.approverRoleKey) return user.roles?.includes(current.approverRoleKey);
      return true;
    });
  }

  // ---- Act --------------------------------------------------------------
  async act(user: AuthenticatedUser, id: string, dto: ActDto) {
    const tid = this.requireTenant(user.tenantId);
    const instance = await this.prisma.approvalInstance.findFirst({ where: { id, tenantId: tid }, include: { steps: { orderBy: { stepOrder: 'asc' } } } });
    if (!instance) throw new NotFoundException('Approval instance not found');
    if (instance.status !== 'pending') throw new BadRequestException(`Instance is already ${instance.status}`);

    const current = instance.steps.find((s) => s.status === 'pending');
    if (!current) throw new BadRequestException('No pending step to act on');

    // Authorize: the resolved user must match, or the user must hold the step's role.
    if (current.resolvedApproverUserId) {
      if (current.resolvedApproverUserId !== user.id) throw new ForbiddenException('You are not the assigned approver for this step');
    } else if (current.approverRoleKey) {
      if (!user.roles?.includes(current.approverRoleKey)) throw new ForbiddenException(`Requires role "${current.approverRoleKey}"`);
    }

    await this.prisma.approvalStepRecord.update({
      where: { id: current.id },
      data: { status: dto.decision === 'approve' ? 'approved' : 'rejected', actedByUserId: user.id, actedAt: new Date(), comment: dto.comment },
    });

    if (dto.decision === 'reject') {
      await this.prisma.approvalInstance.update({ where: { id }, data: { status: 'rejected' } });
      await this.completeSource(tid, instance.module, instance.entityId, 'rejected', instance.requestedBy, dto.comment);
    } else {
      const remaining = instance.steps.filter((s) => s.status === 'pending' && s.id !== current.id);
      if (remaining.length === 0) {
        await this.prisma.approvalInstance.update({ where: { id }, data: { status: 'approved' } });
        await this.completeSource(tid, instance.module, instance.entityId, 'approved', instance.requestedBy);
      } else {
        await this.prisma.approvalInstance.update({ where: { id }, data: { currentStep: remaining[0].stepOrder } });
        if (remaining[0].resolvedApproverUserId) {
          await this.notifications.notify({ tenantId: tid, recipientUserId: remaining[0].resolvedApproverUserId, event: `${instance.module}.approval.pending`, title: 'Persetujuan menunggu Anda', body: `Ada ${instance.module} menunggu persetujuan Anda.`, data: { instanceId: id } });
        }
      }
    }

    await this.audit.record({ tenantId: tid, actorId: user.id, action: `approval.${dto.decision}`, entityType: 'ApprovalInstance', entityId: id, metadata: { step: current.stepOrder } });
    return this.getInstance(tid, id);
  }

  /**
   * Propagate the final decision to the source record (PRD §10.27: workflow
   * drives module status). New modules just add a case here.
   */
  private async completeSource(tenantId: string, module: string, entityId: string, decision: 'approved' | 'rejected', notifyUserId: string | null, comment?: string) {
    const approved = decision === 'approved';
    switch (module) {
      case 'leave':
        await this.prisma.leaveRequest.updateMany({ where: { id: entityId, tenantId }, data: { status: decision, approvedAt: new Date(), rejectReason: approved ? null : (comment ?? 'Rejected') } });
        break;
      case 'overtime':
        await this.prisma.overtimeRequest.updateMany({ where: { id: entityId, tenantId }, data: { status: decision, approvedAt: new Date(), rejectReason: approved ? null : (comment ?? 'Rejected') } });
        break;
      case 'reimbursement':
        await this.prisma.reimbursement.updateMany({ where: { id: entityId, tenantId }, data: { status: decision, approvedAt: new Date(), rejectReason: approved ? null : (comment ?? 'Rejected') } });
        break;
      case 'loan':
        await this.prisma.loan.updateMany({ where: { id: entityId, tenantId }, data: { status: approved ? 'active' : 'rejected', approvedAt: new Date(), rejectReason: approved ? null : (comment ?? 'Rejected') } });
        break;
      case 'permission':
        await this.prisma.permissionRequest.updateMany({ where: { id: entityId, tenantId }, data: { status: decision, approvedAt: new Date() } });
        break;
      case 'replacement':
        await this.prisma.replacementRequest.updateMany({ where: { id: entityId, tenantId }, data: { status: decision } });
        break;
      case 'payroll':
        await this.prisma.payrollRun.updateMany({ where: { id: entityId, tenantId }, data: { status: approved ? 'approved' : 'cancelled', approvedAt: new Date() } });
        break;
      case 'invoice':
        await this.prisma.invoice.updateMany({ where: { id: entityId, tenantId }, data: { status: approved ? 'approved' : 'draft', approvedAt: new Date() } });
        break;
      case 'manpowerRequest':
        await this.prisma.manpowerRequest.updateMany({ where: { id: entityId, tenantId }, data: { status: approved ? 'client_approved' : 'rejected' } });
        break;
      case 'contract':
        await this.prisma.contract.updateMany({ where: { id: entityId, tenantId }, data: { status: approved ? 'approved' : 'draft', approvedAt: new Date() } });
        break;
      case 'placement':
        await this.prisma.placement.updateMany({ where: { id: entityId, tenantId }, data: { status: approved ? 'active' : 'cancelled' } });
        break;
      default:
        // Modules without a source-status hook just rely on the instance status.
        break;
    }
    if (notifyUserId) {
      await this.notifications.notify({ tenantId, recipientUserId: notifyUserId, event: `${module}.${decision}`, title: approved ? 'Pengajuan disetujui' : 'Pengajuan ditolak', body: `Pengajuan ${module} Anda telah ${approved ? 'disetujui' : 'ditolak'}.`, data: { module, entityId } });
    }
  }
}
