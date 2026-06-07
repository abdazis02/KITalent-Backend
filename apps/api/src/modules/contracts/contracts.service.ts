import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { buildMeta, normalizePagination, type Paginated } from '@kitalent/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ApprovalService } from '../approval/approval.service';
import { PdfService } from '../../common/pdf/pdf.service';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import type { CreateContractDto } from './dto/create-contract.dto';
import type { QueryContractDto } from './dto/query-contract.dto';

const idr = (n: number): string => `Rp ${Math.round(n).toLocaleString('id-ID')}`;
const ymd = (d: Date | null | undefined): string => (d ? d.toISOString().slice(0, 10) : '-');

@Injectable()
export class ContractsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly approvals: ApprovalService,
    private readonly pdf: PdfService,
  ) {}

  /** Render a contract as a PDF document (PRD §18 contracts/:id/generate-pdf). */
  async renderPdf(tenantId: string | null, id: string): Promise<{ buffer: Buffer; filename: string }> {
    const tid = this.requireTenant(tenantId);
    const contract = await this.findOne(tid, id);
    const [employee, client] = await Promise.all([
      contract.employeeId ? this.prisma.employee.findFirst({ where: { id: contract.employeeId, tenantId: tid }, select: { fullName: true, employeeNo: true } }) : null,
      contract.clientId ? this.prisma.client.findFirst({ where: { id: contract.clientId, tenantId: tid }, select: { name: true } }) : null,
    ]);
    const buffer = await this.pdf.generate({
      title: 'KONTRAK',
      subtitle: `${contract.number} — ${contract.title}`,
      meta: [
        ['Jenis', contract.type],
        ['Status', contract.status],
        ['Mulai', ymd(contract.startDate)],
        ['Berakhir', ymd(contract.endDate)],
        ...(employee ? [['Karyawan', `${employee.fullName} (${employee.employeeNo})`] as [string, string]] : []),
        ...(client ? [['Klien', client.name] as [string, string]] : []),
        ...(contract.value != null ? [['Nilai', idr(contract.value)] as [string, string]] : []),
      ],
      footer: contract.notes ?? undefined,
    });
    return { buffer, filename: `${contract.number}.pdf` };
  }

  private requireTenant(tenantId: string | null): string {
    if (!tenantId) throw new ForbiddenException('A tenant context is required');
    return tenantId;
  }

  /** Submit a draft contract into the tiered approval workflow (PRD §10.27). */
  async submitForApproval(user: AuthenticatedUser, id: string) {
    const tid = this.requireTenant(user.tenantId);
    const contract = await this.findOne(tid, id);
    if (contract.status !== 'draft') throw new BadRequestException(`Only a draft contract can be submitted (status "${contract.status}")`);
    const instance = await this.approvals.startForModule({ tenantId: tid, module: 'contract', entityId: id, subjectEmployeeId: contract.employeeId ?? undefined, amount: contract.value ?? 0, requestedBy: user.id });
    if (!instance) return { ...contract, approval: null as unknown, note: 'No active approval workflow — use approve directly' };
    const updated = await this.prisma.contract.update({ where: { id }, data: { status: 'waiting_approval', updatedBy: user.id } });
    await this.audit.record({ tenantId: tid, actorId: user.id, action: 'contract.submit', entityType: 'Contract', entityId: id });
    return { ...updated, approval: instance };
  }

  async create(user: AuthenticatedUser, dto: CreateContractDto) {
    const tid = this.requireTenant(user.tenantId);
    if (!dto.employeeId && !dto.clientId) {
      throw new BadRequestException('A contract must reference an employee or a client');
    }
    if (dto.employeeId) await this.assertRef('employee', tid, dto.employeeId);
    if (dto.clientId) await this.assertRef('client', tid, dto.clientId);

    const contract = await this.prisma.contract.create({
      data: {
        tenantId: tid,
        number: dto.number,
        title: dto.title,
        type: dto.type as never,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        employeeId: dto.employeeId,
        clientId: dto.clientId,
        value: dto.value,
        fileKey: dto.fileKey,
        notes: dto.notes,
        status: 'draft',
        createdBy: user.id,
      },
    });
    await this.audit.record({ tenantId: tid, actorId: user.id, action: 'contract.create', entityType: 'Contract', entityId: contract.id });
    return contract;
  }

  async list(tenantId: string | null, query: QueryContractDto): Promise<Paginated<unknown>> {
    const tid = this.requireTenant(tenantId);
    const { page, pageSize } = normalizePagination(query);
    const where: Prisma.ContractWhereInput = {
      tenantId: tid,
      deletedAt: null,
      ...(query.status ? { status: query.status as never } : {}),
      ...(query.type ? { type: query.type as never } : {}),
      ...(query.employeeId ? { employeeId: query.employeeId } : {}),
      ...(query.clientId ? { clientId: query.clientId } : {}),
      ...(query.expiringBefore ? { endDate: { lte: new Date(query.expiringBefore) } } : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.contract.findMany({ where, orderBy: { [query.sortBy ?? 'startDate']: query.sortOrder }, skip: (page - 1) * pageSize, take: pageSize }),
      this.prisma.contract.count({ where }),
    ]);
    return { data, meta: buildMeta(page, pageSize, total) };
  }

  async findOne(tenantId: string | null, id: string) {
    const tid = this.requireTenant(tenantId);
    const contract = await this.prisma.contract.findFirst({ where: { id, tenantId: tid, deletedAt: null } });
    if (!contract) throw new NotFoundException('Contract not found');
    return contract;
  }

  async approve(user: AuthenticatedUser, id: string) {
    const tid = this.requireTenant(user.tenantId);
    const contract = await this.findOne(tid, id);
    if (!['draft', 'waiting_approval'].includes(contract.status)) {
      throw new BadRequestException(`Cannot approve a contract in status "${contract.status}"`);
    }
    const updated = await this.prisma.contract.update({ where: { id }, data: { status: 'approved', approvedBy: user.id, approvedAt: new Date(), updatedBy: user.id } });
    await this.audit.record({ tenantId: tid, actorId: user.id, action: 'contract.approve', entityType: 'Contract', entityId: id });
    return updated;
  }

  /** Mark a contract signed → active (PRD §10.10). */
  async sign(user: AuthenticatedUser, id: string) {
    const tid = this.requireTenant(user.tenantId);
    const contract = await this.findOne(tid, id);
    if (!['approved', 'sent'].includes(contract.status)) {
      throw new BadRequestException(`Only an approved/sent contract can be signed (current: ${contract.status})`);
    }
    const updated = await this.prisma.contract.update({ where: { id }, data: { status: 'active', signedAt: new Date(), updatedBy: user.id } });
    await this.audit.record({ tenantId: tid, actorId: user.id, action: 'contract.sign', entityType: 'Contract', entityId: id });
    return updated;
  }

  /** Send an approved contract out for signature (PRD §18 send-signature). */
  async sendForSignature(user: AuthenticatedUser, id: string) {
    const tid = this.requireTenant(user.tenantId);
    const contract = await this.findOne(tid, id);
    if (contract.status !== 'approved') throw new BadRequestException(`Only an approved contract can be sent for signature (current: ${contract.status})`);
    const updated = await this.prisma.contract.update({ where: { id }, data: { status: 'sent', updatedBy: user.id } });
    await this.audit.record({ tenantId: tid, actorId: user.id, action: 'contract.sendSignature', entityType: 'Contract', entityId: id });
    return updated;
  }

  /**
   * Renew a contract (PRD §18 renew): the current contract is marked 'renewed'
   * and a fresh draft is created carrying its terms with the new period.
   */
  async renew(user: AuthenticatedUser, id: string, dto: { number: string; startDate: string; endDate?: string }) {
    const tid = this.requireTenant(user.tenantId);
    const prev = await this.findOne(tid, id);
    if (!['active', 'expiring_soon', 'expired', 'signed'].includes(prev.status)) {
      throw new BadRequestException(`Only an active/expiring/expired contract can be renewed (current: ${prev.status})`);
    }
    const renewed = await this.prisma.$transaction(async (tx) => {
      const next = await tx.contract.create({
        data: {
          tenantId: tid,
          number: dto.number,
          title: prev.title,
          type: prev.type,
          startDate: new Date(dto.startDate),
          endDate: dto.endDate ? new Date(dto.endDate) : null,
          employeeId: prev.employeeId,
          clientId: prev.clientId,
          value: prev.value,
          notes: prev.notes,
          status: 'draft',
          createdBy: user.id,
        },
      });
      await tx.contract.update({ where: { id }, data: { status: 'renewed', updatedBy: user.id } });
      return next;
    });
    await this.audit.record({ tenantId: tid, actorId: user.id, action: 'contract.renew', entityType: 'Contract', entityId: renewed.id, metadata: { renewedFrom: id } });
    return renewed;
  }

  async terminate(user: AuthenticatedUser, id: string) {
    const tid = this.requireTenant(user.tenantId);
    const contract = await this.findOne(tid, id);
    if (!['active', 'signed'].includes(contract.status)) {
      throw new BadRequestException(`Only an active contract can be terminated (current: ${contract.status})`);
    }
    const updated = await this.prisma.contract.update({ where: { id }, data: { status: 'terminated', updatedBy: user.id } });
    await this.audit.record({ tenantId: tid, actorId: user.id, action: 'contract.terminate', entityType: 'Contract', entityId: id });
    return updated;
  }

  async remove(user: AuthenticatedUser, id: string) {
    const tid = this.requireTenant(user.tenantId);
    await this.findOne(tid, id);
    await this.prisma.contract.update({ where: { id }, data: { deletedAt: new Date(), deletedBy: user.id } });
    await this.audit.record({ tenantId: tid, actorId: user.id, action: 'contract.delete', entityType: 'Contract', entityId: id });
    return { id, deleted: true };
  }

  private async assertRef(kind: 'employee' | 'client', tenantId: string, id: string) {
    const found =
      kind === 'employee'
        ? await this.prisma.employee.findFirst({ where: { id, tenantId, deletedAt: null }, select: { id: true } })
        : await this.prisma.client.findFirst({ where: { id, tenantId, deletedAt: null }, select: { id: true } });
    if (!found) throw new NotFoundException(`${kind} not found in this tenant`);
  }
}
