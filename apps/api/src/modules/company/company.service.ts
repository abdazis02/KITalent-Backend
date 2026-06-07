import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import type { CreateBranchDto, CreateCompanyDto, CreateWorkLocationDto } from './dto/company.dto';

/** Company structure (PRD §10.3): companies, branches, work locations + geofence. */
@Injectable()
export class CompanyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  private requireTenant(tenantId: string | null): string {
    if (!tenantId) throw new ForbiddenException('A tenant context is required');
    return tenantId;
  }

  // ---- Companies ----
  async createCompany(user: AuthenticatedUser, dto: CreateCompanyDto) {
    const tid = this.requireTenant(user.tenantId);
    const company = await this.prisma.company.create({ data: { ...dto, tenantId: tid, createdBy: user.id } });
    await this.audit.record({ tenantId: tid, actorId: user.id, action: 'company.create', entityType: 'Company', entityId: company.id });
    return company;
  }

  listCompanies(tenantId: string | null) {
    const tid = this.requireTenant(tenantId);
    return this.prisma.company.findMany({ where: { tenantId: tid, deletedAt: null }, orderBy: { name: 'asc' }, take: 500, include: { _count: { select: { employees: true, branches: true } } } });
  }

  // ---- Branches ----
  async createBranch(user: AuthenticatedUser, dto: CreateBranchDto) {
    const tid = this.requireTenant(user.tenantId);
    if (dto.companyId) {
      const company = await this.prisma.company.findFirst({ where: { id: dto.companyId, tenantId: tid, deletedAt: null }, select: { id: true } });
      if (!company) throw new NotFoundException('Company not found in this tenant');
    }
    const branch = await this.prisma.branch.create({ data: { ...dto, tenantId: tid, createdBy: user.id } });
    await this.audit.record({ tenantId: tid, actorId: user.id, action: 'branch.create', entityType: 'Branch', entityId: branch.id });
    return branch;
  }

  listBranches(tenantId: string | null) {
    const tid = this.requireTenant(tenantId);
    return this.prisma.branch.findMany({ where: { tenantId: tid, deletedAt: null }, orderBy: { code: 'asc' }, take: 500 });
  }

  // ---- Work locations (geofence) ----
  async createLocation(user: AuthenticatedUser, dto: CreateWorkLocationDto) {
    const tid = this.requireTenant(user.tenantId);
    const location = await this.prisma.workLocation.create({ data: { ...dto, tenantId: tid, createdBy: user.id } });
    await this.audit.record({ tenantId: tid, actorId: user.id, action: 'workLocation.create', entityType: 'WorkLocation', entityId: location.id });
    return location;
  }

  listLocations(tenantId: string | null) {
    const tid = this.requireTenant(tenantId);
    return this.prisma.workLocation.findMany({ where: { tenantId: tid, deletedAt: null }, orderBy: { code: 'asc' }, take: 500 });
  }
}
