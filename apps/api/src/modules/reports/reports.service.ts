import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

function startOfToday(): Date {
  const d = new Date();
  // UTC midnight to align with Postgres @db.Date attendance keys.
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/**
 * Aggregate dashboards (PRD §10.29). Read-only roll-ups across the modules
 * already built — workforce, attendance, approvals, payroll, billing.
 */
@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  private requireTenant(tenantId: string | null): string {
    if (!tenantId) throw new ForbiddenException('A tenant context is required');
    return tenantId;
  }

  async dashboard(tenantId: string | null) {
    const tid = this.requireTenant(tenantId);
    const today = startOfToday();
    const in30Days = new Date(today.getTime() + 30 * 86_400_000);

    const [
      employeesActive,
      employeesTotal,
      clientsActive,
      placementsActive,
      attendanceToday,
      leavesPending,
      overtimePending,
      reimbursementsPending,
      contractsExpiring,
      invoices,
      latestPayroll,
    ] = await Promise.all([
      this.prisma.employee.count({ where: { tenantId: tid, deletedAt: null, status: { in: ['active', 'probation'] } } }),
      this.prisma.employee.count({ where: { tenantId: tid, deletedAt: null } }),
      this.prisma.client.count({ where: { tenantId: tid, deletedAt: null, isActive: true } }),
      this.prisma.placement.count({ where: { tenantId: tid, deletedAt: null, status: 'active' } }),
      this.prisma.attendanceRecord.groupBy({
        by: ['status'],
        where: { tenantId: tid, date: today, deletedAt: null },
        _count: { _all: true },
      }),
      this.prisma.leaveRequest.count({ where: { tenantId: tid, deletedAt: null, status: { in: ['submitted', 'waiting_approval'] } } }),
      this.prisma.overtimeRequest.count({ where: { tenantId: tid, deletedAt: null, status: { in: ['submitted', 'waiting_approval'] } } }),
      this.prisma.reimbursement.count({ where: { tenantId: tid, deletedAt: null, status: { in: ['submitted', 'waiting_approval'] } } }),
      this.prisma.contract.count({ where: { tenantId: tid, deletedAt: null, status: 'active', endDate: { lte: in30Days, gte: today } } }),
      this.prisma.invoice.findMany({
        where: { tenantId: tid, deletedAt: null, status: { in: ['approved', 'sent', 'partially_paid', 'overdue'] } },
        select: { totalAmount: true, paidAmount: true },
      }),
      this.prisma.payrollRun.findFirst({ where: { tenantId: tid, deletedAt: null }, orderBy: { periodLabel: 'desc' }, select: { periodLabel: true, status: true, totalNet: true, employeeCount: true } }),
    ]);

    const attendanceByStatus = Object.fromEntries(attendanceToday.map((r) => [r.status, r._count._all]));
    const outstanding = invoices.reduce((sum, i) => sum + (i.totalAmount - i.paidAmount), 0);

    return {
      workforce: { employeesActive, employeesTotal, clientsActive, placementsActive },
      attendanceToday: {
        present: attendanceByStatus.present ?? 0,
        late: attendanceByStatus.late ?? 0,
        absent: attendanceByStatus.absent ?? 0,
        leave: attendanceByStatus.leave ?? 0,
      },
      approvalsPending: { leaves: leavesPending, overtime: overtimePending, reimbursements: reimbursementsPending },
      contractsExpiringSoon: contractsExpiring,
      billing: { outstandingInvoices: invoices.length, outstandingAmount: outstanding },
      payroll: latestPayroll ?? null,
      generatedAt: new Date().toISOString(),
    };
  }
}
