import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { buildMeta, normalizePagination, type Paginated } from '@kitalent/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { FieldCryptoService } from '../../common/crypto/field-crypto.service';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import type { CreateEmployeeDto } from './dto/create-employee.dto';
import type { UpdateEmployeeDto } from './dto/update-employee.dto';
import type { QueryEmployeeDto } from './dto/query-employee.dto';

/** PRD §0.10 — restricted personal/financial fields. */
const SENSITIVE_FIELDS = ['nik', 'npwp', 'bankAccount', 'basicSalary'] as const;
/** Subset stored encrypted-at-rest (String columns) — PRD §22. */
const ENCRYPTED_FIELDS = ['nik', 'npwp', 'bankAccount'] as const;
const SENSITIVE_PERMISSION = 'employee.read.sensitive';

@Injectable()
export class EmployeesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly crypto: FieldCryptoService,
  ) {}

  /** Every query is pinned to the caller's tenant (PRD §0.3). */
  private requireTenant(tenantId: string | null): string {
    if (!tenantId) throw new ForbiddenException('A tenant context is required');
    return tenantId;
  }

  /**
   * Reading: callers with the sensitive permission get decrypted values; everyone
   * else gets the restricted fields nulled out (PRD §0.10 + §22 encryption-at-rest).
   */
  private mask<T extends Record<string, unknown>>(user: AuthenticatedUser, row: T): T {
    if (user.permissions?.includes(SENSITIVE_PERMISSION)) return this.decryptSensitive(row);
    const copy = { ...row } as Record<string, unknown>;
    for (const f of SENSITIVE_FIELDS) if (f in copy) copy[f] = null;
    return copy as T;
  }

  /** Decrypt the encrypted-at-rest fields for an authorized reader. */
  private decryptSensitive<T extends Record<string, unknown>>(row: T): T {
    const copy = { ...row } as Record<string, unknown>;
    for (const f of ENCRYPTED_FIELDS) if (typeof copy[f] === 'string') copy[f] = this.crypto.decrypt(copy[f] as string);
    return copy as T;
  }

  /** Encrypt sensitive fields present on a write payload (PRD §22). */
  private encryptSensitive(dto: CreateEmployeeDto | UpdateEmployeeDto): Partial<Record<(typeof ENCRYPTED_FIELDS)[number], string | null>> {
    const src = dto as Record<string, unknown>;
    const out: Partial<Record<(typeof ENCRYPTED_FIELDS)[number], string | null>> = {};
    for (const f of ENCRYPTED_FIELDS) {
      const v = src[f];
      if (v !== undefined) out[f] = this.crypto.encrypt(v as string | null) ?? null;
    }
    return out;
  }

  async list(user: AuthenticatedUser, query: QueryEmployeeDto): Promise<Paginated<unknown>> {
    const tid = this.requireTenant(user.tenantId);
    const { page, pageSize } = normalizePagination(query);

    const where: Prisma.EmployeeWhereInput = {
      tenantId: tid,
      deletedAt: null,
      ...(query.status ? { status: query.status as never } : {}),
      ...(query.companyId ? { companyId: query.companyId } : {}),
      ...(query.search
        ? {
            OR: [
              { fullName: { contains: query.search, mode: 'insensitive' } },
              { employeeNo: { contains: query.search, mode: 'insensitive' } },
              { email: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.employee.findMany({
        where,
        orderBy: { [query.sortBy ?? 'createdAt']: query.sortOrder },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.employee.count({ where }),
    ]);

    return { data: data.map((e) => this.mask(user, e)), meta: buildMeta(page, pageSize, total) };
  }

  async findOne(user: AuthenticatedUser, id: string) {
    const tid = this.requireTenant(user.tenantId);
    const employee = await this.prisma.employee.findFirst({
      where: { id, tenantId: tid, deletedAt: null },
    });
    if (!employee) throw new NotFoundException('Employee not found');
    return this.mask(user, employee);
  }

  /** The employee profile linked to the caller's user account (PRD §10.30 self-service). */
  async myProfile(user: AuthenticatedUser) {
    const tid = this.requireTenant(user.tenantId);
    const employee = await this.prisma.employee.findFirst({
      where: { userId: user.id, tenantId: tid, deletedAt: null },
    });
    if (!employee) throw new NotFoundException('No employee profile is linked to your account');
    return this.mask(user, employee);
  }

  /** ISO date strings → Date for @db.Date columns; cast enums. */
  private coerced(dto: CreateEmployeeDto | UpdateEmployeeDto) {
    return {
      birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
      joinDate: dto.joinDate ? new Date(dto.joinDate) : undefined,
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      resignDate: dto.resignDate ? new Date(dto.resignDate) : undefined,
      status: (dto.status as never) ?? undefined,
      employmentType: (dto.employmentType as never) ?? undefined,
    };
  }

  async create(user: AuthenticatedUser, dto: CreateEmployeeDto) {
    const tid = this.requireTenant(user.tenantId);
    const employee = await this.prisma.employee.create({
      data: {
        ...dto,
        ...this.coerced(dto),
        ...this.encryptSensitive(dto),
        tenantId: tid,
        createdBy: user.id,
      },
    });
    await this.audit.record({
      tenantId: tid,
      actorId: user.id,
      action: 'employee.create',
      entityType: 'Employee',
      entityId: employee.id,
    });
    return this.mask(user, employee);
  }

  /** Direct subordinates of an employee (PRD §10.4 hierarchy). */
  async team(user: AuthenticatedUser, id: string) {
    const tid = this.requireTenant(user.tenantId);
    await this.assertOwned(tid, id);
    const subordinates = await this.prisma.employee.findMany({
      where: { tenantId: tid, supervisorId: id, deletedAt: null },
      orderBy: { fullName: 'asc' },
      take: 500,
    });
    return subordinates.map((e) => this.mask(user, e));
  }

  /** Tenant-ownership check without masking (for internal mutations). */
  private async assertOwned(tenantId: string, id: string): Promise<void> {
    const found = await this.prisma.employee.findFirst({ where: { id, tenantId, deletedAt: null }, select: { id: true } });
    if (!found) throw new NotFoundException('Employee not found');
  }

  async update(user: AuthenticatedUser, id: string, dto: UpdateEmployeeDto) {
    const tid = this.requireTenant(user.tenantId);
    await this.assertOwned(tid, id); // tenant ownership check
    const employee = await this.prisma.employee.update({
      where: { id },
      data: { ...dto, ...this.coerced(dto), ...this.encryptSensitive(dto), updatedBy: user.id },
    });
    await this.audit.record({
      tenantId: tid,
      actorId: user.id,
      action: 'employee.update',
      entityType: 'Employee',
      entityId: id,
    });
    return this.mask(user, employee);
  }

  /** Soft delete (PRD §0.6). */
  async remove(user: AuthenticatedUser, id: string) {
    const tid = this.requireTenant(user.tenantId);
    await this.assertOwned(tid, id);
    await this.prisma.employee.update({
      where: { id },
      data: { deletedAt: new Date(), deletedBy: user.id },
    });
    await this.audit.record({
      tenantId: tid,
      actorId: user.id,
      action: 'employee.delete',
      entityType: 'Employee',
      entityId: id,
    });
    return { id, deleted: true };
  }
}
