import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { buildMeta, normalizePagination, type Paginated } from '@kitalent/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import type { ConvertCandidateDto, CreateCandidateDto, MoveStageDto, QueryCandidateDto, RejectCandidateDto } from './dto/candidate.dto';

// Stages from which a candidate may be converted into an employee.
const CONVERTIBLE_STAGES = ['offering', 'accepted', 'onboarding'];

@Injectable()
export class CandidatesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  private requireTenant(tenantId: string | null): string {
    if (!tenantId) throw new ForbiddenException('A tenant context is required');
    return tenantId;
  }

  async create(user: AuthenticatedUser, dto: CreateCandidateDto) {
    const tid = this.requireTenant(user.tenantId);
    if (dto.vacancyId) {
      const vacancy = await this.prisma.jobVacancy.findFirst({ where: { id: dto.vacancyId, tenantId: tid, deletedAt: null }, select: { id: true } });
      if (!vacancy) throw new NotFoundException('Vacancy not found in this tenant');
    }
    const candidate = await this.prisma.candidate.create({ data: { ...dto, tenantId: tid, stage: 'applied', createdBy: user.id } });
    await this.audit.record({ tenantId: tid, actorId: user.id, action: 'candidate.create', entityType: 'Candidate', entityId: candidate.id });
    return candidate;
  }

  async list(tenantId: string | null, query: QueryCandidateDto): Promise<Paginated<unknown>> {
    const tid = this.requireTenant(tenantId);
    const { page, pageSize } = normalizePagination(query);
    const where: Prisma.CandidateWhereInput = {
      tenantId: tid,
      deletedAt: null,
      ...(query.stage ? { stage: query.stage as never } : {}),
      ...(query.vacancyId ? { vacancyId: query.vacancyId } : {}),
      ...(query.search ? { fullName: { contains: query.search, mode: 'insensitive' } } : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.candidate.findMany({ where, orderBy: { createdAt: query.sortOrder }, skip: (page - 1) * pageSize, take: pageSize }),
      this.prisma.candidate.count({ where }),
    ]);
    return { data, meta: buildMeta(page, pageSize, total) };
  }

  private async load(tenantId: string, id: string) {
    const candidate = await this.prisma.candidate.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!candidate) throw new NotFoundException('Candidate not found');
    return candidate;
  }

  async findOne(tenantId: string | null, id: string) {
    return this.load(this.requireTenant(tenantId), id);
  }

  /** Advance/move a candidate through the pipeline (PRD §10.9). */
  async move(user: AuthenticatedUser, id: string, dto: MoveStageDto) {
    const tid = this.requireTenant(user.tenantId);
    const candidate = await this.load(tid, id);
    if (['rejected', 'hired'].includes(candidate.stage)) {
      throw new BadRequestException(`Candidate is already ${candidate.stage}`);
    }
    const updated = await this.prisma.candidate.update({ where: { id }, data: { stage: dto.stage as never, updatedBy: user.id } });
    await this.audit.record({ tenantId: tid, actorId: user.id, action: 'candidate.move', entityType: 'Candidate', entityId: id, metadata: { from: candidate.stage, to: dto.stage } });
    return updated;
  }

  async reject(user: AuthenticatedUser, id: string, dto: RejectCandidateDto) {
    const tid = this.requireTenant(user.tenantId);
    const candidate = await this.load(tid, id);
    if (candidate.stage === 'hired') throw new BadRequestException('Cannot reject a hired candidate');
    const updated = await this.prisma.candidate.update({ where: { id }, data: { stage: 'rejected', rejectReason: dto.reason, updatedBy: user.id } });
    await this.audit.record({ tenantId: tid, actorId: user.id, action: 'candidate.reject', entityType: 'Candidate', entityId: id, metadata: { reason: dto.reason } });
    return updated;
  }

  async blacklist(user: AuthenticatedUser, id: string) {
    const tid = this.requireTenant(user.tenantId);
    await this.load(tid, id);
    const updated = await this.prisma.candidate.update({ where: { id }, data: { blacklisted: true, updatedBy: user.id } });
    await this.audit.record({ tenantId: tid, actorId: user.id, action: 'candidate.blacklist', entityType: 'Candidate', entityId: id });
    return updated;
  }

  /**
   * Convert an accepted candidate into an Employee (PRD §10.9). Creates the
   * employee record, marks the candidate hired, and links the two.
   */
  async convert(user: AuthenticatedUser, id: string, dto: ConvertCandidateDto) {
    const tid = this.requireTenant(user.tenantId);
    const candidate = await this.load(tid, id);
    // Check prior conversion first so an already-hired candidate returns 409.
    if (candidate.convertedEmployeeId) throw new ConflictException('Candidate already converted');
    if (candidate.blacklisted) throw new BadRequestException('Cannot hire a blacklisted candidate');
    if (!CONVERTIBLE_STAGES.includes(candidate.stage)) {
      throw new BadRequestException(`Candidate must be at offering/accepted/onboarding to convert (current: ${candidate.stage})`);
    }

    const existing = await this.prisma.employee.findFirst({ where: { tenantId: tid, employeeNo: dto.employeeNo }, select: { id: true } });
    if (existing) throw new ConflictException(`Employee number "${dto.employeeNo}" already exists`);

    const employee = await this.prisma.$transaction(async (tx) => {
      const emp = await tx.employee.create({
        data: {
          tenantId: tid,
          employeeNo: dto.employeeNo,
          fullName: candidate.fullName,
          email: candidate.email,
          phone: candidate.phone,
          status: 'onboarding',
          createdBy: user.id,
        },
      });
      await tx.candidate.update({ where: { id }, data: { stage: 'hired', convertedEmployeeId: emp.id, updatedBy: user.id } });
      return emp;
    });

    await this.audit.record({ tenantId: tid, actorId: user.id, action: 'candidate.convert', entityType: 'Employee', entityId: employee.id, metadata: { candidateId: id } });
    return employee;
  }
}
