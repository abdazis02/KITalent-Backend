import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { buildMeta, normalizePagination, type Paginated } from '@kitalent/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import type { CompleteEnrollmentDto, CreateTrainingDto, EnrollDto, QueryTrainingDto } from './dto/training.dto';

@Injectable()
export class TrainingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  private requireTenant(tenantId: string | null): string {
    if (!tenantId) throw new ForbiddenException('A tenant context is required');
    return tenantId;
  }

  async create(user: AuthenticatedUser, dto: CreateTrainingDto) {
    const tid = this.requireTenant(user.tenantId);
    const training = await this.prisma.training.create({
      data: { ...dto, scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null, tenantId: tid, status: 'planned', createdBy: user.id },
    });
    await this.audit.record({ tenantId: tid, actorId: user.id, action: 'training.create', entityType: 'Training', entityId: training.id });
    return training;
  }

  async list(tenantId: string | null, query: QueryTrainingDto): Promise<Paginated<unknown>> {
    const tid = this.requireTenant(tenantId);
    const { page, pageSize } = normalizePagination(query);
    const where: Prisma.TrainingWhereInput = {
      tenantId: tid,
      deletedAt: null,
      ...(query.status ? { status: query.status as never } : {}),
      ...(query.search ? { OR: [{ title: { contains: query.search, mode: 'insensitive' } }, { code: { contains: query.search, mode: 'insensitive' } }] } : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.training.findMany({ where, orderBy: { createdAt: query.sortOrder }, skip: (page - 1) * pageSize, take: pageSize, include: { _count: { select: { enrollments: true } } } }),
      this.prisma.training.count({ where }),
    ]);
    return { data, meta: buildMeta(page, pageSize, total) };
  }

  private async loadTraining(tenantId: string, id: string) {
    const training = await this.prisma.training.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!training) throw new NotFoundException('Training not found');
    return training;
  }

  async enroll(user: AuthenticatedUser, trainingId: string, dto: EnrollDto) {
    const tid = this.requireTenant(user.tenantId);
    await this.loadTraining(tid, trainingId);
    const employee = await this.prisma.employee.findFirst({ where: { id: dto.employeeId, tenantId: tid, deletedAt: null }, select: { id: true } });
    if (!employee) throw new NotFoundException('Employee not found in this tenant');

    const existing = await this.prisma.trainingEnrollment.findUnique({ where: { trainingId_employeeId: { trainingId, employeeId: dto.employeeId } } });
    if (existing) throw new ConflictException('Employee already enrolled in this training');

    const enrollment = await this.prisma.trainingEnrollment.create({ data: { tenantId: tid, trainingId, employeeId: dto.employeeId, status: 'enrolled', createdBy: user.id } });
    await this.audit.record({ tenantId: tid, actorId: user.id, action: 'training.enroll', entityType: 'TrainingEnrollment', entityId: enrollment.id });
    return enrollment;
  }

  listEnrollments(tenantId: string | null, trainingId: string) {
    const tid = this.requireTenant(tenantId);
    return this.prisma.trainingEnrollment.findMany({
      where: { trainingId, tenantId: tid },
      include: { employee: { select: { employeeNo: true, fullName: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  /** Record an enrollment result + (optional) certificate (PRD §10.25). */
  async completeEnrollment(user: AuthenticatedUser, enrollmentId: string, dto: CompleteEnrollmentDto) {
    const tid = this.requireTenant(user.tenantId);
    const enrollment = await this.prisma.trainingEnrollment.findFirst({ where: { id: enrollmentId, tenantId: tid } });
    if (!enrollment) throw new NotFoundException('Enrollment not found');
    if (enrollment.status !== 'enrolled' && enrollment.status !== 'attended') {
      throw new BadRequestException(`Enrollment is already ${enrollment.status}`);
    }
    const updated = await this.prisma.trainingEnrollment.update({
      where: { id: enrollmentId },
      data: {
        status: dto.status as never,
        score: dto.score,
        certificateKey: dto.certificateKey,
        certificateExpiry: dto.certificateExpiry ? new Date(dto.certificateExpiry) : null,
        updatedBy: user.id,
      },
    });
    await this.audit.record({ tenantId: tid, actorId: user.id, action: 'training.complete', entityType: 'TrainingEnrollment', entityId: enrollmentId, metadata: { status: dto.status } });
    return updated;
  }

  /** Certifications expiring on/before the given date (PRD §10.25 reminder). */
  expiringCertifications(tenantId: string | null, before: string) {
    const tid = this.requireTenant(tenantId);
    return this.prisma.trainingEnrollment.findMany({
      where: { tenantId: tid, certificateExpiry: { not: null, lte: new Date(before) }, status: 'passed' },
      include: { employee: { select: { employeeNo: true, fullName: true } }, training: { select: { title: true } } },
      orderBy: { certificateExpiry: 'asc' },
    });
  }
}
