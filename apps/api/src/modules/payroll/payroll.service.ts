import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { buildMeta, normalizePagination, type Paginated } from '@kitalent/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ApprovalService } from '../approval/approval.service';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import type { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import type { CreateComponentDto } from './dto/create-component.dto';
import type { AssignItemDto, SetBasicSalaryDto } from './dto/assign-item.dto';
import type { CreateRunDto } from './dto/create-run.dto';
import { computePayslip, type ComponentInput } from './payroll.engine';

// Statuses in which a run may still be (re)calculated.
const RECALCULABLE: string[] = ['draft', 'calculating', 'need_review'];

@Injectable()
export class PayrollService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly approvals: ApprovalService,
  ) {}

  private requireTenant(tenantId: string | null): string {
    if (!tenantId) throw new ForbiddenException('A tenant context is required');
    return tenantId;
  }

  /** Submit a calculated run into the tiered approval workflow (PRD §10.27). */
  async submitForApproval(user: AuthenticatedUser, id: string) {
    const tid = this.requireTenant(user.tenantId);
    const run = await this.getRun(tid, id);
    if (run.status !== 'need_review') throw new BadRequestException(`Only a run in "need_review" can be submitted (status "${run.status}")`);
    const instance = await this.approvals.startForModule({ tenantId: tid, module: 'payroll', entityId: id, amount: run.totalNet ?? 0, requestedBy: user.id });
    if (!instance) return { ...run, approval: null as unknown, note: 'No active approval workflow — use approve directly' };
    const updated = await this.prisma.payrollRun.update({ where: { id }, data: { status: 'waiting_approval', updatedBy: user.id } });
    await this.audit.record({ tenantId: tid, actorId: user.id, action: 'payroll.submit', entityType: 'PayrollRun', entityId: id });
    return { ...updated, approval: instance };
  }

  // ---- Component master (configurable) ----------------------------------
  async createComponent(user: AuthenticatedUser, dto: CreateComponentDto) {
    const tid = this.requireTenant(user.tenantId);
    const component = await this.prisma.payrollComponent.create({
      data: { ...dto, type: dto.type as never, tenantId: tid },
    });
    await this.audit.record({ tenantId: tid, actorId: user.id, action: 'payroll.component.create', entityType: 'PayrollComponent', entityId: component.id });
    return component;
  }

  async listComponents(tenantId: string | null) {
    const tid = this.requireTenant(tenantId);
    return this.prisma.payrollComponent.findMany({ where: { tenantId: tid, deletedAt: null }, orderBy: { code: 'asc' } });
  }

  // ---- Employee payroll setup -------------------------------------------
  async setBasicSalary(user: AuthenticatedUser, employeeId: string, dto: SetBasicSalaryDto) {
    const tid = this.requireTenant(user.tenantId);
    await this.assertEmployee(tid, employeeId);
    const employee = await this.prisma.employee.update({
      where: { id: employeeId },
      data: { basicSalary: dto.basicSalary, updatedBy: user.id },
    });
    await this.audit.record({ tenantId: tid, actorId: user.id, action: 'payroll.salary.set', entityType: 'Employee', entityId: employeeId });
    return { id: employee.id, basicSalary: employee.basicSalary };
  }

  async assignItem(user: AuthenticatedUser, employeeId: string, dto: AssignItemDto) {
    const tid = this.requireTenant(user.tenantId);
    await this.assertEmployee(tid, employeeId);
    const component = await this.prisma.payrollComponent.findFirst({
      where: { id: dto.componentId, tenantId: tid, deletedAt: null },
    });
    if (!component) throw new NotFoundException('Payroll component not found in this tenant');

    return this.prisma.employeePayrollItem.upsert({
      where: { employeeId_componentId: { employeeId, componentId: dto.componentId } },
      create: { tenantId: tid, employeeId, componentId: dto.componentId, amount: dto.amount },
      update: { amount: dto.amount },
    });
  }

  // ---- Run lifecycle -----------------------------------------------------
  /** Creates (or recalculates) a run and computes every active employee's payslip. */
  async createRun(user: AuthenticatedUser, dto: CreateRunDto) {
    const tid = this.requireTenant(user.tenantId);

    const existing = await this.prisma.payrollRun.findUnique({
      where: { tenantId_periodLabel: { tenantId: tid, periodLabel: dto.periodLabel } },
    });
    if (existing && !RECALCULABLE.includes(existing.status)) {
      throw new BadRequestException(`Run for ${dto.periodLabel} is ${existing.status} and cannot be recalculated`);
    }

    const periodStart = new Date(dto.periodStart);
    const periodEnd = new Date(dto.periodEnd);
    if (periodEnd < periodStart) throw new BadRequestException('periodEnd must be on or after periodStart');

    const employees = await this.prisma.employee.findMany({
      where: { tenantId: tid, deletedAt: null, status: { in: ['active', 'probation'] } },
      include: { payrollItems: { include: { component: true } } },
    });

    // Attendance per employee for the period (drives absence deduction).
    const attendance = await this.prisma.attendanceRecord.groupBy({
      by: ['employeeId', 'status'],
      where: { tenantId: tid, date: { gte: periodStart, lte: periodEnd }, deletedAt: null },
      _count: { _all: true },
    });
    const presentByEmp = new Map<string, number>();
    const absentByEmp = new Map<string, number>();
    for (const row of attendance) {
      const map = row.status === 'absent' ? absentByEmp : row.status === 'present' || row.status === 'late' ? presentByEmp : null;
      if (map) map.set(row.employeeId, (map.get(row.employeeId) ?? 0) + row._count._all);
    }

    // Approved overtime in the period per employee (PRD §10.16 → §10.17 integration).
    const overtime = await this.prisma.overtimeRequest.groupBy({
      by: ['employeeId'],
      where: { tenantId: tid, status: 'approved', date: { gte: periodStart, lte: periodEnd }, deletedAt: null },
      _sum: { durationMinutes: true },
    });
    const overtimeByEmp = new Map<string, number>();
    for (const row of overtime) overtimeByEmp.set(row.employeeId, row._sum.durationMinutes ?? 0);

    // Active loan installments per employee become 'loan' deduction lines
    // (PRD §10.20 → §10.17). Capped at the outstanding balance.
    const loans = await this.prisma.loan.findMany({
      where: { tenantId: tid, status: 'active', outstanding: { gt: 0 }, deletedAt: null },
    });
    const loanLinesByEmp = new Map<string, ComponentInput[]>();
    for (const loan of loans) {
      const amount = Math.min(loan.monthlyDeduction, loan.outstanding);
      const arr = loanLinesByEmp.get(loan.employeeId) ?? [];
      arr.push({ code: `LOAN-${loan.id.slice(0, 8)}`, name: `Cicilan: ${loan.title}`, type: 'loan', amount });
      loanLinesByEmp.set(loan.employeeId, arr);
    }

    const computed = employees.map((emp) => {
      const items: ComponentInput[] = emp.payrollItems
        .filter((it) => it.component.isActive && it.component.deletedAt === null)
        .map((it) => ({ code: it.component.code, name: it.component.name, type: it.component.type, amount: it.amount }));
      items.push(...(loanLinesByEmp.get(emp.id) ?? []));
      return {
        employeeId: emp.id,
        result: computePayslip({
          basicSalary: emp.basicSalary,
          items,
          presentDays: presentByEmp.get(emp.id) ?? 0,
          absentDays: absentByEmp.get(emp.id) ?? 0,
          overtimeMinutes: overtimeByEmp.get(emp.id) ?? 0,
        }),
      };
    });

    const totals = computed.reduce(
      (acc, c) => {
        acc.gross += c.result.totalEarning;
        acc.deduction += c.result.totalDeduction;
        acc.net += c.result.netSalary;
        return acc;
      },
      { gross: 0, deduction: 0, net: 0 },
    );

    // Persist atomically: replace prior payslips on recalculation.
    const run = await this.prisma.$transaction(async (tx) => {
      const r = await tx.payrollRun.upsert({
        where: { tenantId_periodLabel: { tenantId: tid, periodLabel: dto.periodLabel } },
        create: {
          tenantId: tid,
          periodLabel: dto.periodLabel,
          periodStart,
          periodEnd,
          status: 'need_review',
          totalGross: totals.gross,
          totalDeduction: totals.deduction,
          totalNet: totals.net,
          employeeCount: computed.length,
          createdBy: user.id,
        },
        update: {
          periodStart,
          periodEnd,
          status: 'need_review',
          totalGross: totals.gross,
          totalDeduction: totals.deduction,
          totalNet: totals.net,
          employeeCount: computed.length,
          updatedBy: user.id,
        },
      });

      await tx.payslip.deleteMany({ where: { runId: r.id } });

      for (const c of computed) {
        await tx.payslip.create({
          data: {
            tenantId: tid,
            runId: r.id,
            employeeId: c.employeeId,
            basicSalary: c.result.basicSalary,
            totalEarning: c.result.totalEarning,
            totalDeduction: c.result.totalDeduction,
            netSalary: c.result.netSalary,
            presentDays: c.result.presentDays,
            absentDays: c.result.absentDays,
            overtimeMinutes: c.result.overtimeMinutes,
            components: {
              create: c.result.lines.map((l) => ({ code: l.code, name: l.name, type: l.type, amount: l.amount })),
            },
          },
        });
      }
      return r;
    });

    await this.audit.record({
      tenantId: tid,
      actorId: user.id,
      action: 'payroll.run',
      entityType: 'PayrollRun',
      entityId: run.id,
      metadata: { periodLabel: dto.periodLabel, employeeCount: computed.length, totalNet: totals.net },
    });
    return run;
  }

  async approveRun(user: AuthenticatedUser, id: string) {
    const tid = this.requireTenant(user.tenantId);
    const run = await this.getRun(tid, id);
    if (!['need_review', 'waiting_approval'].includes(run.status)) {
      throw new BadRequestException(`Cannot approve a run in status "${run.status}"`);
    }
    const updated = await this.prisma.payrollRun.update({
      where: { id },
      data: { status: 'approved', approvedBy: user.id, approvedAt: new Date(), updatedBy: user.id },
    });
    await this.audit.record({ tenantId: tid, actorId: user.id, action: 'payroll.approve', entityType: 'PayrollRun', entityId: id });
    return updated;
  }

  /** Locks an approved run — immutable thereafter (PRD §10.17 business rule). */
  async lockRun(user: AuthenticatedUser, id: string) {
    const tid = this.requireTenant(user.tenantId);
    const run = await this.getRun(tid, id);
    if (run.status !== 'approved') throw new BadRequestException('Only an approved run can be locked');
    const updated = await this.prisma.payrollRun.update({
      where: { id },
      data: { status: 'locked', lockedAt: new Date(), updatedBy: user.id },
    });
    await this.audit.record({ tenantId: tid, actorId: user.id, action: 'payroll.lock', entityType: 'PayrollRun', entityId: id });
    return updated;
  }

  // ---- Reads -------------------------------------------------------------
  async listRuns(tenantId: string | null, query: PaginationQueryDto): Promise<Paginated<unknown>> {
    const tid = this.requireTenant(tenantId);
    const { page, pageSize } = normalizePagination(query);
    const where: Prisma.PayrollRunWhereInput = { tenantId: tid, deletedAt: null };
    const [data, total] = await Promise.all([
      this.prisma.payrollRun.findMany({ where, orderBy: { periodLabel: query.sortOrder }, skip: (page - 1) * pageSize, take: pageSize }),
      this.prisma.payrollRun.count({ where }),
    ]);
    return { data, meta: buildMeta(page, pageSize, total) };
  }

  async getRun(tenantId: string | null, id: string) {
    const tid = this.requireTenant(tenantId);
    const run = await this.prisma.payrollRun.findFirst({ where: { id, tenantId: tid, deletedAt: null } });
    if (!run) throw new NotFoundException('Payroll run not found');
    return run;
  }

  async listPayslips(tenantId: string | null, runId: string) {
    const tid = this.requireTenant(tenantId);
    await this.getRun(tid, runId);
    return this.prisma.payslip.findMany({
      where: { runId, tenantId: tid },
      include: { employee: { select: { employeeNo: true, fullName: true } } },
      orderBy: { employee: { employeeNo: 'asc' } },
    });
  }

  /** Full salary slip with line items (PRD §10.18). */
  async getPayslip(tenantId: string | null, id: string) {
    const tid = this.requireTenant(tenantId);
    const payslip = await this.prisma.payslip.findFirst({
      where: { id, tenantId: tid },
      include: {
        components: true,
        employee: { select: { employeeNo: true, fullName: true } },
        run: { select: { periodLabel: true, status: true } },
      },
    });
    if (!payslip) throw new NotFoundException('Payslip not found');
    return payslip;
  }

  private async assertEmployee(tenantId: string, employeeId: string) {
    const emp = await this.prisma.employee.findFirst({ where: { id: employeeId, tenantId, deletedAt: null }, select: { id: true } });
    if (!emp) throw new NotFoundException('Employee not found in this tenant');
  }
}
