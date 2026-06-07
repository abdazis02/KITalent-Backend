import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { buildMeta, normalizePagination, type Paginated } from '@kitalent/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import type { CreateLoanDto } from './dto/create-loan.dto';
import type { QueryLoanDto, RejectLoanDto } from './dto/query-loan.dto';

@Injectable()
export class LoansService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  private requireTenant(tenantId: string | null): string {
    if (!tenantId) throw new ForbiddenException('A tenant context is required');
    return tenantId;
  }

  async create(user: AuthenticatedUser, dto: CreateLoanDto) {
    const tid = this.requireTenant(user.tenantId);
    const employee = await this.prisma.employee.findFirst({ where: { id: dto.employeeId, tenantId: tid, deletedAt: null }, select: { id: true } });
    if (!employee) throw new NotFoundException('Employee not found in this tenant');

    // Equal monthly installments; the last one absorbs any rounding remainder at runtime.
    const monthlyDeduction = Math.ceil(dto.principal / dto.installmentCount);
    const loan = await this.prisma.loan.create({
      data: {
        tenantId: tid,
        employeeId: dto.employeeId,
        title: dto.title,
        principal: dto.principal,
        installmentCount: dto.installmentCount,
        monthlyDeduction,
        outstanding: dto.principal,
        status: 'requested',
        createdBy: user.id,
      },
    });
    await this.audit.record({ tenantId: tid, actorId: user.id, action: 'loan.create', entityType: 'Loan', entityId: loan.id });
    return loan;
  }

  async list(tenantId: string | null, query: QueryLoanDto): Promise<Paginated<unknown>> {
    const tid = this.requireTenant(tenantId);
    const { page, pageSize } = normalizePagination(query);
    const where: Prisma.LoanWhereInput = {
      tenantId: tid,
      deletedAt: null,
      ...(query.status ? { status: query.status as never } : {}),
      ...(query.employeeId ? { employeeId: query.employeeId } : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.loan.findMany({ where, orderBy: { createdAt: query.sortOrder }, skip: (page - 1) * pageSize, take: pageSize }),
      this.prisma.loan.count({ where }),
    ]);
    return { data, meta: buildMeta(page, pageSize, total) };
  }

  private async load(tenantId: string, id: string) {
    const loan = await this.prisma.loan.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!loan) throw new NotFoundException('Loan not found');
    return loan;
  }

  /** Approve a loan request → active; installments then deduct in payroll. */
  async approve(user: AuthenticatedUser, id: string) {
    const tid = this.requireTenant(user.tenantId);
    const loan = await this.load(tid, id);
    if (loan.status !== 'requested') throw new BadRequestException(`Cannot approve a loan in status "${loan.status}"`);
    const updated = await this.prisma.loan.update({ where: { id }, data: { status: 'active', approvedBy: user.id, approvedAt: new Date(), updatedBy: user.id } });
    await this.audit.record({ tenantId: tid, actorId: user.id, action: 'loan.approve', entityType: 'Loan', entityId: id });
    return updated;
  }

  async reject(user: AuthenticatedUser, id: string, dto: RejectLoanDto) {
    const tid = this.requireTenant(user.tenantId);
    if (!dto.reason) throw new BadRequestException('A reason is required to reject');
    const loan = await this.load(tid, id);
    if (loan.status !== 'requested') throw new BadRequestException(`Cannot reject a loan in status "${loan.status}"`);
    const updated = await this.prisma.loan.update({ where: { id }, data: { status: 'rejected', rejectReason: dto.reason, updatedBy: user.id } });
    await this.audit.record({ tenantId: tid, actorId: user.id, action: 'loan.reject', entityType: 'Loan', entityId: id });
    return updated;
  }
}
