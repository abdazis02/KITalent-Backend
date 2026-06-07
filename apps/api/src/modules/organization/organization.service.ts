import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import type { CreateDepartmentDto, CreateJobLevelDto, CreatePositionDto } from './dto/organization.dto';

/** Organization structure (PRD §10.4): departments, job levels, positions. */
@Injectable()
export class OrganizationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  private requireTenant(tenantId: string | null): string {
    if (!tenantId) throw new ForbiddenException('A tenant context is required');
    return tenantId;
  }

  async createDepartment(user: AuthenticatedUser, dto: CreateDepartmentDto) {
    const tid = this.requireTenant(user.tenantId);
    if (dto.parentId) {
      const parent = await this.prisma.department.findFirst({ where: { id: dto.parentId, tenantId: tid, deletedAt: null }, select: { id: true } });
      if (!parent) throw new NotFoundException('Parent department not found in this tenant');
    }
    const dept = await this.prisma.department.create({ data: { ...dto, tenantId: tid, createdBy: user.id } });
    await this.audit.record({ tenantId: tid, actorId: user.id, action: 'department.create', entityType: 'Department', entityId: dept.id });
    return dept;
  }

  listDepartments(tenantId: string | null) {
    const tid = this.requireTenant(tenantId);
    return this.prisma.department.findMany({ where: { tenantId: tid, deletedAt: null }, orderBy: { code: 'asc' }, take: 500, include: { _count: { select: { employees: true, children: true } } } });
  }

  async createJobLevel(user: AuthenticatedUser, dto: CreateJobLevelDto) {
    const tid = this.requireTenant(user.tenantId);
    const level = await this.prisma.jobLevel.create({ data: { ...dto, tenantId: tid } });
    await this.audit.record({ tenantId: tid, actorId: user.id, action: 'jobLevel.create', entityType: 'JobLevel', entityId: level.id });
    return level;
  }

  listJobLevels(tenantId: string | null) {
    const tid = this.requireTenant(tenantId);
    return this.prisma.jobLevel.findMany({ where: { tenantId: tid, deletedAt: null }, orderBy: { rank: 'asc' }, take: 500 });
  }

  async createPosition(user: AuthenticatedUser, dto: CreatePositionDto) {
    const tid = this.requireTenant(user.tenantId);
    const position = await this.prisma.position.create({ data: { ...dto, tenantId: tid } });
    await this.audit.record({ tenantId: tid, actorId: user.id, action: 'position.create', entityType: 'Position', entityId: position.id });
    return position;
  }

  listPositions(tenantId: string | null) {
    const tid = this.requireTenant(tenantId);
    return this.prisma.position.findMany({
      where: { tenantId: tid, deletedAt: null },
      orderBy: { code: 'asc' },
      take: 500,
      include: { department: { select: { name: true } }, jobLevel: { select: { name: true } } },
    });
  }
}
