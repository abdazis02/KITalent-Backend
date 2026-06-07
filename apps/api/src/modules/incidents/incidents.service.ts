import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { buildMeta, normalizePagination, type Paginated } from '@kitalent/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import type { CreateIncidentDto, QueryIncidentDto, ResolveIncidentDto } from './dto/incident.dto';

@Injectable()
export class IncidentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  private requireTenant(tenantId: string | null): string {
    if (!tenantId) throw new ForbiddenException('A tenant context is required');
    return tenantId;
  }

  async create(user: AuthenticatedUser, dto: CreateIncidentDto) {
    const tid = this.requireTenant(user.tenantId);
    const employee = await this.prisma.employee.findFirst({ where: { id: dto.employeeId, tenantId: tid, deletedAt: null }, select: { id: true } });
    if (!employee) throw new NotFoundException('Employee not found in this tenant');

    const incident = await this.prisma.incident.create({
      data: {
        tenantId: tid,
        employeeId: dto.employeeId,
        category: dto.category,
        severity: dto.severity ?? 'medium',
        title: dto.title,
        description: dto.description,
        incidentDate: new Date(dto.incidentDate),
        attachmentKey: dto.attachmentKey,
        status: 'reported',
        reportedBy: user.id,
        createdBy: user.id,
      },
    });
    await this.audit.record({ tenantId: tid, actorId: user.id, action: 'incident.create', entityType: 'Incident', entityId: incident.id });
    return incident;
  }

  async list(tenantId: string | null, query: QueryIncidentDto): Promise<Paginated<unknown>> {
    const tid = this.requireTenant(tenantId);
    const { page, pageSize } = normalizePagination(query);
    const where: Prisma.IncidentWhereInput = {
      tenantId: tid,
      deletedAt: null,
      ...(query.status ? { status: query.status as never } : {}),
      ...(query.severity ? { severity: query.severity } : {}),
      ...(query.employeeId ? { employeeId: query.employeeId } : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.incident.findMany({ where, orderBy: { incidentDate: query.sortOrder }, skip: (page - 1) * pageSize, take: pageSize }),
      this.prisma.incident.count({ where }),
    ]);
    return { data, meta: buildMeta(page, pageSize, total) };
  }

  async findOne(tenantId: string | null, id: string) {
    const tid = this.requireTenant(tenantId);
    const incident = await this.prisma.incident.findFirst({ where: { id, tenantId: tid, deletedAt: null }, include: { employee: { select: { employeeNo: true, fullName: true } } } });
    if (!incident) throw new NotFoundException('Incident not found');
    return incident;
  }

  async investigate(user: AuthenticatedUser, id: string) {
    const tid = this.requireTenant(user.tenantId);
    const incident = await this.findOne(tid, id);
    if (incident.status !== 'reported') throw new BadRequestException(`Cannot investigate an incident in status "${incident.status}"`);
    const updated = await this.prisma.incident.update({ where: { id }, data: { status: 'investigating', updatedBy: user.id } });
    await this.audit.record({ tenantId: tid, actorId: user.id, action: 'incident.investigate', entityType: 'Incident', entityId: id });
    return updated;
  }

  /** Resolve with an optional sanction / warning letter (PRD §10.23). */
  async resolve(user: AuthenticatedUser, id: string, dto: ResolveIncidentDto) {
    const tid = this.requireTenant(user.tenantId);
    const incident = await this.findOne(tid, id);
    if (!['reported', 'investigating', 'action_taken'].includes(incident.status)) {
      throw new BadRequestException(`Cannot resolve an incident in status "${incident.status}"`);
    }
    const updated = await this.prisma.incident.update({
      where: { id },
      data: { status: 'resolved', sanction: dto.sanction, investigationNotes: dto.investigationNotes, resolvedBy: user.id, resolvedAt: new Date(), updatedBy: user.id },
    });
    await this.audit.record({ tenantId: tid, actorId: user.id, action: 'incident.resolve', entityType: 'Incident', entityId: id, metadata: { sanction: dto.sanction } });
    return updated;
  }

  async dismiss(user: AuthenticatedUser, id: string) {
    const tid = this.requireTenant(user.tenantId);
    const incident = await this.findOne(tid, id);
    if (incident.status === 'resolved') throw new BadRequestException('A resolved incident cannot be dismissed');
    const updated = await this.prisma.incident.update({ where: { id }, data: { status: 'dismissed', resolvedBy: user.id, resolvedAt: new Date(), updatedBy: user.id } });
    await this.audit.record({ tenantId: tid, actorId: user.id, action: 'incident.dismiss', entityType: 'Incident', entityId: id });
    return updated;
  }
}
