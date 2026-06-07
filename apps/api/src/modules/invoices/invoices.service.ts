import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { buildMeta, normalizePagination, type Paginated } from '@kitalent/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ApprovalService } from '../approval/approval.service';
import { PdfService } from '../../common/pdf/pdf.service';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import type { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

/** Format whole-rupiah amounts as "Rp 1.234.567" (PRD §10.21 — amounts are integer IDR). */
const idr = (n: number): string => `Rp ${Math.round(n).toLocaleString('id-ID')}`;
import type { CreateInvoiceDto } from './dto/create-invoice.dto';
import type { GenerateFromPayrollDto } from './dto/generate-from-payroll.dto';
import type { RecordPaymentDto } from './dto/record-payment.dto';

interface ComputedItem {
  type: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

@Injectable()
export class InvoicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly approvals: ApprovalService,
    private readonly pdf: PdfService,
  ) {}

  /** Render an invoice as a PDF document (PRD §18 invoices/:id/pdf). */
  async renderPdf(tenantId: string | null, id: string): Promise<{ buffer: Buffer; filename: string }> {
    const invoice = await this.findOne(tenantId, id);
    const outstanding = invoice.totalAmount - invoice.paidAmount;
    const buffer = await this.pdf.generate({
      title: 'INVOICE',
      subtitle: invoice.invoiceNo,
      meta: [
        ['Klien', invoice.client?.name ?? '-'],
        ['Tanggal Terbit', invoice.issueDate.toISOString().slice(0, 10)],
        ['Jatuh Tempo', invoice.dueDate.toISOString().slice(0, 10)],
        ['Status', invoice.status],
        ...(invoice.periodLabel ? [['Periode', invoice.periodLabel] as [string, string]] : []),
      ],
      table: {
        columns: ['Deskripsi', 'Qty', 'Harga', 'Jumlah'],
        widths: [5, 1, 2, 2],
        rows: invoice.items.map((it) => [it.description, it.quantity, idr(it.unitPrice), idr(it.amount)]),
      },
      totals: [
        ['Subtotal', idr(invoice.subtotal)],
        ['Pajak', idr(invoice.taxAmount)],
        ['Diskon', `- ${idr(invoice.discountAmount)}`],
        ['Total', idr(invoice.totalAmount)],
        ['Dibayar', idr(invoice.paidAmount)],
        ['Sisa', idr(outstanding)],
      ],
    });
    return { buffer, filename: `${invoice.invoiceNo}.pdf` };
  }

  private requireTenant(tenantId: string | null): string {
    if (!tenantId) throw new ForbiddenException('A tenant context is required');
    return tenantId;
  }

  /**
   * Submit a draft invoice into the tiered approval workflow (PRD §10.27).
   * If a workflow is active it owns the invoice (→ waiting_approval, decided via
   * the approval inbox); otherwise the inline approve() endpoint still applies.
   */
  async submitForApproval(user: AuthenticatedUser, id: string) {
    const tid = this.requireTenant(user.tenantId);
    const invoice = await this.findOne(tid, id);
    if (invoice.status !== 'draft') throw new BadRequestException(`Only a draft invoice can be submitted (status "${invoice.status}")`);
    const instance = await this.approvals.startForModule({ tenantId: tid, module: 'invoice', entityId: id, amount: invoice.totalAmount, requestedBy: user.id });
    if (!instance) return { ...invoice, approval: null as unknown, note: 'No active approval workflow — use approve directly' };
    const updated = await this.prisma.invoice.update({ where: { id }, data: { status: 'waiting_approval', updatedBy: user.id } });
    await this.audit.record({ tenantId: tid, actorId: user.id, action: 'invoice.submit', entityType: 'Invoice', entityId: id });
    return { ...updated, approval: instance };
  }

  /** Subtotal → +tax → −discount = total (PRD §10.21). */
  private totals(items: ComputedItem[], taxPercent: number, discountAmount: number) {
    const subtotal = items.reduce((s, i) => s + i.amount, 0);
    const taxAmount = Math.round((subtotal * taxPercent) / 100);
    const totalAmount = subtotal + taxAmount - discountAmount;
    return { subtotal, taxAmount, totalAmount };
  }

  private async nextInvoiceNo(tenantId: string, period: string): Promise<string> {
    const count = await this.prisma.invoice.count({ where: { tenantId } });
    return `INV-${period}-${String(count + 1).padStart(4, '0')}`;
  }

  private async assertClient(tenantId: string, clientId: string) {
    const client = await this.prisma.client.findFirst({ where: { id: clientId, tenantId, deletedAt: null }, select: { id: true } });
    if (!client) throw new NotFoundException('Client not found in this tenant');
  }

  async create(user: AuthenticatedUser, dto: CreateInvoiceDto) {
    const tid = this.requireTenant(user.tenantId);
    await this.assertClient(tid, dto.clientId);

    const items: ComputedItem[] = dto.items.map((i) => {
      const quantity = i.quantity ?? 1;
      return {
        type: i.type ?? 'service',
        description: i.description,
        quantity,
        unitPrice: i.unitPrice,
        amount: quantity * i.unitPrice,
      };
    });
    const { subtotal, taxAmount, totalAmount } = this.totals(items, dto.taxPercent ?? 0, dto.discountAmount ?? 0);
    const period = dto.periodLabel ?? new Date(dto.issueDate).toISOString().slice(0, 7);

    const invoice = await this.prisma.invoice.create({
      data: {
        tenantId: tid,
        clientId: dto.clientId,
        invoiceNo: await this.nextInvoiceNo(tid, period),
        periodLabel: dto.periodLabel,
        issueDate: new Date(dto.issueDate),
        dueDate: new Date(dto.dueDate),
        status: 'draft',
        subtotal,
        taxPercent: dto.taxPercent ?? 0,
        taxAmount,
        discountAmount: dto.discountAmount ?? 0,
        totalAmount,
        notes: dto.notes,
        createdBy: user.id,
        items: { create: items.map((i) => ({ type: i.type as never, description: i.description, quantity: i.quantity, unitPrice: i.unitPrice, amount: i.amount })) },
      },
      include: { items: true },
    });

    await this.audit.record({ tenantId: tid, actorId: user.id, action: 'invoice.create', entityType: 'Invoice', entityId: invoice.id });
    return invoice;
  }

  /** Build an invoice from a payroll run: labor cost (gross) + management fee + VAT. */
  async generateFromPayroll(user: AuthenticatedUser, dto: GenerateFromPayrollDto) {
    const tid = this.requireTenant(user.tenantId);
    await this.assertClient(tid, dto.clientId);

    const run = await this.prisma.payrollRun.findFirst({ where: { id: dto.payrollRunId, tenantId: tid, deletedAt: null } });
    if (!run) throw new NotFoundException('Payroll run not found in this tenant');
    if (!['approved', 'locked', 'paid'].includes(run.status)) {
      throw new BadRequestException(`Payroll run must be approved before billing (current: ${run.status})`);
    }

    const labor = run.totalGross;
    const fee = Math.round((labor * dto.managementFeePercent) / 100);
    const items: ComputedItem[] = [
      { type: 'payroll', description: `Biaya tenaga kerja periode ${run.periodLabel}`, quantity: 1, unitPrice: labor, amount: labor },
      { type: 'management_fee', description: `Management fee ${dto.managementFeePercent}%`, quantity: 1, unitPrice: fee, amount: fee },
    ];
    const taxPercent = dto.taxPercent ?? 11;
    const { subtotal, taxAmount, totalAmount } = this.totals(items, taxPercent, 0);
    const today = new Date();

    const invoice = await this.prisma.invoice.create({
      data: {
        tenantId: tid,
        clientId: dto.clientId,
        payrollRunId: run.id,
        invoiceNo: await this.nextInvoiceNo(tid, run.periodLabel),
        periodLabel: run.periodLabel,
        issueDate: today,
        dueDate: new Date(dto.dueDate),
        status: 'draft',
        subtotal,
        taxPercent,
        taxAmount,
        totalAmount,
        createdBy: user.id,
        items: { create: items.map((i) => ({ type: i.type as never, description: i.description, quantity: i.quantity, unitPrice: i.unitPrice, amount: i.amount })) },
      },
      include: { items: true },
    });

    await this.audit.record({
      tenantId: tid,
      actorId: user.id,
      action: 'invoice.generate',
      entityType: 'Invoice',
      entityId: invoice.id,
      metadata: { payrollRunId: run.id, totalAmount },
    });
    return invoice;
  }

  async list(tenantId: string | null, query: PaginationQueryDto): Promise<Paginated<unknown>> {
    const tid = this.requireTenant(tenantId);
    const { page, pageSize } = normalizePagination(query);
    const where: Prisma.InvoiceWhereInput = {
      tenantId: tid,
      deletedAt: null,
      ...(query.search ? { invoiceNo: { contains: query.search, mode: 'insensitive' } } : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.invoice.findMany({ where, orderBy: { issueDate: query.sortOrder }, skip: (page - 1) * pageSize, take: pageSize }),
      this.prisma.invoice.count({ where }),
    ]);
    return { data, meta: buildMeta(page, pageSize, total) };
  }

  async findOne(tenantId: string | null, id: string) {
    const tid = this.requireTenant(tenantId);
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, tenantId: tid, deletedAt: null },
      include: { items: true, payments: true, client: { select: { code: true, name: true } } },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }

  async approve(user: AuthenticatedUser, id: string) {
    const tid = this.requireTenant(user.tenantId);
    const invoice = await this.findOne(tid, id);
    if (!['draft', 'waiting_approval'].includes(invoice.status)) {
      throw new BadRequestException(`Cannot approve an invoice in status "${invoice.status}"`);
    }
    const updated = await this.prisma.invoice.update({
      where: { id },
      data: { status: 'approved', approvedBy: user.id, approvedAt: new Date(), updatedBy: user.id },
    });
    await this.audit.record({ tenantId: tid, actorId: user.id, action: 'invoice.approve', entityType: 'Invoice', entityId: id });
    return updated;
  }

  async send(user: AuthenticatedUser, id: string) {
    const tid = this.requireTenant(user.tenantId);
    const invoice = await this.findOne(tid, id);
    if (invoice.status !== 'approved') throw new BadRequestException('Only an approved invoice can be sent');
    const updated = await this.prisma.invoice.update({ where: { id }, data: { status: 'sent', sentAt: new Date(), updatedBy: user.id } });
    await this.audit.record({ tenantId: tid, actorId: user.id, action: 'invoice.send', entityType: 'Invoice', entityId: id });
    return updated;
  }

  /** Record a payment; settles to partially_paid or paid (PRD §10.21). */
  async recordPayment(user: AuthenticatedUser, id: string, dto: RecordPaymentDto) {
    const tid = this.requireTenant(user.tenantId);
    const invoice = await this.findOne(tid, id);
    if (!['approved', 'sent', 'partially_paid', 'overdue'].includes(invoice.status)) {
      throw new BadRequestException(`Cannot record payment for an invoice in status "${invoice.status}"`);
    }
    const newPaid = invoice.paidAmount + dto.amount;
    if (newPaid > invoice.totalAmount) {
      throw new BadRequestException('Payment exceeds the outstanding balance');
    }
    const status = newPaid >= invoice.totalAmount ? 'paid' : 'partially_paid';

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.invoicePayment.create({
        data: { tenantId: tid, invoiceId: id, amount: dto.amount, method: dto.method, reference: dto.reference, note: dto.note, createdBy: user.id },
      });
      return tx.invoice.update({ where: { id }, data: { paidAmount: newPaid, status, updatedBy: user.id } });
    });

    await this.audit.record({
      tenantId: tid,
      actorId: user.id,
      action: 'invoice.payment',
      entityType: 'Invoice',
      entityId: id,
      metadata: { amount: dto.amount, paidAmount: newPaid, status },
    });
    return updated;
  }
}
