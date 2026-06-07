import { Module } from '@nestjs/common';
import { BadRequestException, Controller, ForbiddenException, Get, Header, Injectable, NotFoundException, Param, ParseUUIDPipe, Post, Query, Res, StreamableFile, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { PdfService } from '../../common/pdf/pdf.service';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser, type AuthenticatedUser } from '../../common/decorators/current-user.decorator';

const idrFmt = (n: number): string => `Rp ${Math.round(n).toLocaleString('id-ID')}`;

/** Minimal shape of a Multer file (avoids a hard @types/multer dependency). */
interface UploadedCsv { buffer: Buffer; originalname?: string }
const EMPLOYMENT_TYPES = ['permanent', 'contract', 'outsourcing', 'daily', 'internship'];

/** Parse one CSV line, honoring double-quoted cells with escaped quotes. */
function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"') { if (line[i + 1] === '"') { cur += '"'; i++; } else quoted = false; }
      else cur += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') { out.push(cur); cur = ''; }
    else cur += ch;
  }
  out.push(cur);
  return out.map((c) => c.trim());
}

/** UTC midnight to align with Postgres @db.Date keys (PRD §10.13). */
function utcDay(iso?: string): Date {
  const d = iso ? new Date(iso) : new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}
function csvCell(v: unknown): string {
  const s = v === null || v === undefined ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

@Injectable()
class ReportsExtendedService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService, private readonly pdf: PdfService) {}
  private tid(t: string | null): string { if (!t) throw new ForbiddenException('A tenant context is required'); return t; }

  /** Render a salary slip as a PDF (PRD §18). Self readable by owner, or anyone with payroll.read.tenant. */
  async salarySlipPdf(user: AuthenticatedUser, id: string): Promise<{ buffer: Buffer; filename: string }> {
    const t = this.tid(user.tenantId);
    const slip = await this.prisma.salarySlip.findFirst({
      where: { id, tenantId: t },
      include: { payslip: { include: { components: true, run: { select: { periodLabel: true } }, employee: { select: { fullName: true, employeeNo: true, userId: true } } } } },
    });
    if (!slip) throw new NotFoundException('Salary slip not found');
    const isOwner = slip.payslip.employee.userId === user.id;
    const canReadTenant = user.permissions?.includes('payroll.read.tenant');
    if (!isOwner && !canReadTenant) throw new ForbiddenException('You can only download your own salary slip');
    const p = slip.payslip;
    const buffer = await this.pdf.generate({
      title: 'SLIP GAJI',
      subtitle: p.run.periodLabel,
      meta: [
        ['Karyawan', `${p.employee.fullName} (${p.employee.employeeNo})`],
        ['Periode', p.run.periodLabel],
        ['Status', slip.status],
      ],
      table: {
        columns: ['Komponen', 'Tipe', 'Jumlah'],
        widths: [4, 2, 2],
        rows: p.components.map((c) => [c.name, c.type, idrFmt(c.amount)]),
      },
      totals: [
        ['Total Pendapatan', idrFmt(p.totalEarning)],
        ['Total Potongan', idrFmt(p.totalDeduction)],
        ['Gaji Bersih', idrFmt(p.netSalary)],
      ],
    });
    return { buffer, filename: `slip-${p.employee.employeeNo}-${p.run.periodLabel}.pdf` };
  }

  /**
   * Bulk-import employees from a CSV (PRD §18 employees/import). Header row must
   * include employeeNo + fullName; optional email/phone/status/employmentType/joinDate.
   * Rows with a duplicate employeeNo (per tenant) are skipped, not errored.
   */
  async employeesImportCsv(user: AuthenticatedUser, file: UploadedCsv | undefined) {
    const t = this.tid(user.tenantId);
    if (!file?.buffer?.length) throw new BadRequestException('A non-empty CSV file is required (field "file")');
    const lines = file.buffer.toString('utf8').split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) throw new BadRequestException('CSV must have a header row and at least one data row');
    const header = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
    const idx = (name: string) => header.indexOf(name.toLowerCase());
    const iNo = idx('employeeNo'), iName = idx('fullName');
    if (iNo < 0 || iName < 0) throw new BadRequestException('CSV header must include employeeNo and fullName');
    const iEmail = idx('email'), iPhone = idx('phone'), iStatus = idx('status'), iType = idx('employmentType'), iJoin = idx('joinDate');

    const errors: Array<{ row: number; message: string }> = [];
    const data: Array<Record<string, unknown>> = [];
    for (let r = 1; r < lines.length; r++) {
      const cells = parseCsvLine(lines[r]);
      const employeeNo = cells[iNo]; const fullName = cells[iName];
      if (!employeeNo || !fullName) { errors.push({ row: r + 1, message: 'employeeNo and fullName are required' }); continue; }
      const empType = iType >= 0 ? cells[iType] : '';
      if (empType && !EMPLOYMENT_TYPES.includes(empType)) { errors.push({ row: r + 1, message: `invalid employmentType "${empType}"` }); continue; }
      const join = iJoin >= 0 ? cells[iJoin] : '';
      data.push({
        tenantId: t, employeeNo, fullName, createdBy: user.id,
        ...(iEmail >= 0 && cells[iEmail] ? { email: cells[iEmail] } : {}),
        ...(iPhone >= 0 && cells[iPhone] ? { phone: cells[iPhone] } : {}),
        ...(iStatus >= 0 && cells[iStatus] ? { status: cells[iStatus] as never } : {}),
        ...(empType ? { employmentType: empType as never } : {}),
        ...(join ? { joinDate: new Date(join) } : {}),
      });
    }
    const result = await this.prisma.employee.createMany({ data: data as never, skipDuplicates: true });
    await this.audit.record({ tenantId: t, actorId: user.id, action: 'employee.import', entityType: 'Employee', entityId: t, metadata: { parsed: data.length, created: result.count, skipped: data.length - result.count, errors: errors.length } });
    return { totalRows: lines.length - 1, parsed: data.length, created: result.count, skipped: data.length - result.count, errors };
  }

  /** Organization chart (PRD §18 organization/chart): department tree + headcount. */
  async orgChart(tenant: string | null) {
    const t = this.tid(tenant);
    const [departments, counts] = await Promise.all([
      this.prisma.department.findMany({ where: { tenantId: t, deletedAt: null }, select: { id: true, parentId: true, code: true, name: true, headEmployeeId: true }, orderBy: { name: 'asc' } }),
      this.prisma.employee.groupBy({ by: ['departmentId'], where: { tenantId: t, deletedAt: null }, _count: { _all: true } }),
    ]);
    const headcount = new Map(counts.map((c) => [c.departmentId, c._count._all]));
    const nodes = departments.map((d) => ({ ...d, employeeCount: headcount.get(d.id) ?? 0, children: [] as unknown[] }));
    const byId = new Map(nodes.map((n) => [n.id, n]));
    const roots: unknown[] = [];
    for (const n of nodes) {
      const parent = n.parentId ? byId.get(n.parentId) : null;
      if (parent) (parent.children as unknown[]).push(n);
      else roots.push(n);
    }
    return { unassigned: headcount.get(null) ?? 0, tree: roots };
  }

  /** Attendance summary over a date range (PRD §18 attendance/reports/summary). */
  async attendanceSummary(tenant: string | null, from?: string, to?: string) {
    const t = this.tid(tenant);
    const start = utcDay(from);
    const end = utcDay(to);
    const grouped = await this.prisma.attendanceRecord.groupBy({
      by: ['status'], where: { tenantId: t, deletedAt: null, date: { gte: start, lte: end } }, _count: { _all: true },
    });
    const byStatus = Object.fromEntries(grouped.map((g) => [g.status, g._count._all]));
    const total = grouped.reduce((s, g) => s + g._count._all, 0);
    return { from: start.toISOString().slice(0, 10), to: end.toISOString().slice(0, 10), total, byStatus };
  }

  /** Invoice aging buckets on outstanding balances (PRD §18 invoices/reports/aging). */
  async invoiceAging(tenant: string | null) {
    const t = this.tid(tenant);
    const today = utcDay();
    const invoices = await this.prisma.invoice.findMany({
      where: { tenantId: t, deletedAt: null, status: { in: ['approved', 'sent', 'partially_paid', 'overdue'] } },
      select: { id: true, invoiceNo: true, clientId: true, dueDate: true, totalAmount: true, paidAmount: true },
    });
    const buckets = { current: 0, d1_30: 0, d31_60: 0, d61_90: 0, d90_plus: 0 };
    let outstanding = 0;
    for (const inv of invoices) {
      const bal = inv.totalAmount - inv.paidAmount;
      if (bal <= 0) continue;
      outstanding += bal;
      const days = Math.floor((today.getTime() - utcDay(inv.dueDate.toISOString()).getTime()) / 86_400_000);
      if (days <= 0) buckets.current += bal;
      else if (days <= 30) buckets.d1_30 += bal;
      else if (days <= 60) buckets.d31_60 += bal;
      else if (days <= 90) buckets.d61_90 += bal;
      else buckets.d90_plus += bal;
    }
    return { outstanding, count: invoices.length, buckets };
  }

  /** Employee self-service: my published salary slips (PRD §18 salary-slips/me). */
  async mySalarySlips(user: AuthenticatedUser) {
    const t = this.tid(user.tenantId);
    const emp = await this.prisma.employee.findFirst({ where: { tenantId: t, userId: user.id, deletedAt: null }, select: { id: true } });
    if (!emp) throw new NotFoundException('No employee profile is linked to your account');
    const slips = await this.prisma.salarySlip.findMany({
      where: { tenantId: t, employeeId: emp.id, status: 'published' },
      include: { payslip: { select: { netSalary: true, totalEarning: true, totalDeduction: true, run: { select: { periodLabel: true } } } } },
      orderBy: { publishedAt: 'desc' }, take: 100,
    });
    return slips.map((s) => ({ id: s.id, status: s.status, publishedAt: s.publishedAt, period: s.payslip.run.periodLabel, netSalary: s.payslip.netSalary, totalEarning: s.payslip.totalEarning, totalDeduction: s.payslip.totalDeduction }));
  }

  /**
   * Generic named-report runner (PRD §18 reports/:reportCode). Returns tabular
   * { columns, rows } so the same payload renders as JSON or exports as CSV.
   */
  async runReport(tenant: string | null, code: string): Promise<{ code: string; columns: string[]; rows: Array<Array<string | number>>; generatedAt: string }> {
    const t = this.tid(tenant);
    let columns: string[] = [];
    let rows: Array<Array<string | number>> = [];
    switch (code) {
      case 'employees': {
        const emps = await this.prisma.employee.findMany({ where: { tenantId: t, deletedAt: null }, select: { employeeNo: true, fullName: true, status: true, employmentType: true }, orderBy: { employeeNo: 'asc' }, take: 10_000 });
        columns = ['employeeNo', 'fullName', 'status', 'employmentType'];
        rows = emps.map((e) => [e.employeeNo, e.fullName, e.status ?? '', e.employmentType ?? '']);
        break;
      }
      case 'headcount-by-department': {
        const [depts, counts] = await Promise.all([
          this.prisma.department.findMany({ where: { tenantId: t, deletedAt: null }, select: { id: true, name: true } }),
          this.prisma.employee.groupBy({ by: ['departmentId'], where: { tenantId: t, deletedAt: null }, _count: { _all: true } }),
        ]);
        const byId = new Map(counts.map((c) => [c.departmentId, c._count._all]));
        columns = ['department', 'headcount'];
        rows = depts.map((d) => [d.name, byId.get(d.id) ?? 0]);
        rows.push(['(unassigned)', byId.get(null) ?? 0]);
        break;
      }
      case 'active-placements': {
        const pls = await this.prisma.placement.findMany({ where: { tenantId: t, deletedAt: null, status: 'active' }, include: { employee: { select: { fullName: true } }, client: { select: { name: true } } }, take: 10_000 });
        columns = ['employee', 'client', 'position', 'startDate'];
        rows = pls.map((p) => [p.employee?.fullName ?? '', p.client?.name ?? '', p.position ?? '', p.startDate ? p.startDate.toISOString().slice(0, 10) : '']);
        break;
      }
      default:
        throw new NotFoundException(`Unknown report code "${code}". Available: employees, headcount-by-department, active-placements`);
    }
    return { code, columns, rows, generatedAt: new Date().toISOString() };
  }

  /** Same report as CSV text (PRD §18 reports/:reportCode export). */
  async runReportCsv(tenant: string | null, code: string): Promise<string> {
    const { columns, rows } = await this.runReport(tenant, code);
    return [columns.join(','), ...rows.map((r) => r.map(csvCell).join(','))].join('\n');
  }

  /** CSV export of employees (non-sensitive columns only — PRD §0.10). */
  async employeesCsv(tenant: string | null): Promise<string> {
    const t = this.tid(tenant);
    const rows = await this.prisma.employee.findMany({
      where: { tenantId: t, deletedAt: null },
      select: { employeeNo: true, fullName: true, email: true, phone: true, status: true, employmentType: true, joinDate: true },
      orderBy: { employeeNo: 'asc' }, take: 10_000,
    });
    const header = ['employeeNo', 'fullName', 'email', 'phone', 'status', 'employmentType', 'joinDate'];
    const lines = [header.join(',')];
    for (const r of rows) {
      lines.push([r.employeeNo, r.fullName, r.email, r.phone, r.status, r.employmentType, r.joinDate ? r.joinDate.toISOString().slice(0, 10) : ''].map(csvCell).join(','));
    }
    return lines.join('\n');
  }
}

@ApiTags('Reports & Self-Service')
@ApiBearerAuth()
@Controller()
class ReportsExtendedController {
  constructor(private readonly s: ReportsExtendedService) {}

  @Get('organization/chart') @RequirePermissions('organization.read.tenant') @ApiOperation({ summary: 'Org chart: department tree with headcount' })
  orgChart(@CurrentTenant() t: string | null) { return this.s.orgChart(t); }

  @Get('reports/attendance-summary') @RequirePermissions('attendance.read.tenant')
  @ApiQuery({ name: 'from', required: false }) @ApiQuery({ name: 'to', required: false }) @ApiOperation({ summary: 'Attendance summary by status over a date range' })
  attendanceSummary(@CurrentTenant() t: string | null, @Query('from') from?: string, @Query('to') to?: string) { return this.s.attendanceSummary(t, from, to); }

  @Get('reports/invoice-aging') @RequirePermissions('invoice.read.tenant') @ApiOperation({ summary: 'Outstanding invoice aging buckets' })
  invoiceAging(@CurrentTenant() t: string | null) { return this.s.invoiceAging(t); }

  @Get('reports/:code/export') @RequirePermissions('report.read.tenant') @Header('Content-Type', 'text/csv; charset=utf-8') @ApiOperation({ summary: 'Run a named report and export as CSV' })
  async reportCsv(@CurrentTenant() t: string | null, @Param('code') code: string, @Res({ passthrough: true }) res: Response): Promise<string> {
    res.set({ 'Content-Disposition': `attachment; filename="${code}.csv"` });
    return this.s.runReportCsv(t, code);
  }

  @Get('reports/:code') @RequirePermissions('report.read.tenant') @ApiOperation({ summary: 'Run a named report (employees | headcount-by-department | active-placements)' })
  report(@CurrentTenant() t: string | null, @Param('code') code: string) { return this.s.runReport(t, code); }

  @Get('salary-slips/me') @RequirePermissions('payroll.read.own') @ApiOperation({ summary: 'My published salary slips (employee self-service)' })
  mySalarySlips(@CurrentUser() u: AuthenticatedUser) { return this.s.mySalarySlips(u); }

  @Get('salary-slips/:id/pdf') @RequirePermissions('payroll.read.own') @ApiOperation({ summary: 'Download a salary slip as PDF (owner or payroll.read.tenant)' })
  async slipPdf(@CurrentUser() u: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string, @Res({ passthrough: true }) res: Response): Promise<StreamableFile> {
    const { buffer, filename } = await this.s.salarySlipPdf(u, id);
    res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${filename}"` });
    return new StreamableFile(buffer);
  }

  @Get('exports/employees') @RequirePermissions('employee.export.tenant') @Header('Content-Type', 'text/csv; charset=utf-8') @Header('Content-Disposition', 'attachment; filename="employees.csv"') @ApiOperation({ summary: 'Export employees as CSV' })
  employeesCsv(@CurrentTenant() t: string | null) { return this.s.employeesCsv(t); }

  @Post('employees/import') @RequirePermissions('employee.create.tenant')
  @UseInterceptors(FileInterceptor('file')) @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @ApiOperation({ summary: 'Bulk-import employees from a CSV file' })
  employeesImport(@CurrentUser() u: AuthenticatedUser, @UploadedFile() file: UploadedCsv) { return this.s.employeesImportCsv(u, file); }
}

@Module({ controllers: [ReportsExtendedController], providers: [ReportsExtendedService] })
export class ReportsExtendedModule {}
