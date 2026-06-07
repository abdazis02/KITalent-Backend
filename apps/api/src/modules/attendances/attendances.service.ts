import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { buildMeta, normalizePagination, type Paginated } from '@kitalent/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import type { CheckInDto } from './dto/check-in.dto';
import type { CheckOutDto } from './dto/check-out.dto';
import type { QueryAttendanceDto } from './dto/query-attendance.dto';
import type { RequestCorrectionDto } from './dto/correction.dto';

/**
 * UTC midnight of the given day — attendance is keyed per (employee, date).
 * Using UTC keeps the value consistent with Postgres `@db.Date` storage and
 * with date-range filters that pass plain `yyyy-mm-dd` strings.
 */
function startOfDay(d = new Date()): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/** Great-circle distance in metres between two lat/lng points (haversine). */
export function distanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6_371_000;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

@Injectable()
export class AttendancesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  private requireTenant(tenantId: string | null): string {
    if (!tenantId) throw new ForbiddenException('A tenant context is required');
    return tenantId;
  }

  private async assertEmployeeInTenant(tenantId: string, employeeId: string): Promise<void> {
    const employee = await this.prisma.employee.findFirst({
      where: { id: employeeId, tenantId, deletedAt: null },
      select: { id: true },
    });
    if (!employee) throw new NotFoundException('Employee not found in this tenant');
  }

  /** Rejects a check-in outside the work location geofence (PRD §10.13). */
  private async assertWithinGeofence(tenantId: string, dto: CheckInDto): Promise<void> {
    if (!dto.workLocationId) return; // no location → policy allows (no geofence)
    const loc = await this.prisma.workLocation.findFirst({ where: { id: dto.workLocationId, tenantId, deletedAt: null } });
    if (!loc) throw new NotFoundException('Work location not found in this tenant');
    if (loc.latitude == null || loc.longitude == null) return; // location has no coordinates configured
    if (dto.lat == null || dto.lng == null) throw new BadRequestException('GPS coordinates are required for this location');
    const distance = distanceMeters(dto.lat, dto.lng, loc.latitude, loc.longitude);
    if (distance > loc.geofenceRadius) {
      throw new BadRequestException(`Outside the work location area (${Math.round(distance)}m from ${loc.name}, allowed ${loc.geofenceRadius}m)`);
    }
  }

  async checkIn(user: AuthenticatedUser, dto: CheckInDto, ipAddress?: string) {
    const tid = this.requireTenant(user.tenantId);
    await this.assertEmployeeInTenant(tid, dto.employeeId);
    await this.assertWithinGeofence(tid, dto);

    const date = startOfDay();
    const existing = await this.prisma.attendanceRecord.findUnique({
      where: { employeeId_date: { employeeId: dto.employeeId, date } },
    });
    if (existing?.checkInAt) {
      throw new BadRequestException('Already checked in today');
    }

    const record = await this.prisma.attendanceRecord.upsert({
      where: { employeeId_date: { employeeId: dto.employeeId, date } },
      create: {
        tenantId: tid,
        employeeId: dto.employeeId,
        date,
        checkInAt: new Date(),
        checkInLat: dto.lat,
        checkInLng: dto.lng,
        selfieKey: dto.selfieKey,
        deviceId: dto.deviceId,
        ipAddress,
        status: 'present',
        createdBy: user.id,
      },
      update: {
        checkInAt: new Date(),
        checkInLat: dto.lat,
        checkInLng: dto.lng,
        selfieKey: dto.selfieKey,
        deviceId: dto.deviceId,
        ipAddress,
        updatedBy: user.id,
      },
    });

    await this.audit.record({
      tenantId: tid,
      actorId: user.id,
      action: 'attendance.checkIn',
      entityType: 'AttendanceRecord',
      entityId: record.id,
      ipAddress,
    });
    return record;
  }

  async checkOut(user: AuthenticatedUser, dto: CheckOutDto) {
    const tid = this.requireTenant(user.tenantId);
    const date = startOfDay();
    const existing = await this.prisma.attendanceRecord.findUnique({
      where: { employeeId_date: { employeeId: dto.employeeId, date } },
    });
    if (!existing?.checkInAt) throw new BadRequestException('No check-in found for today');
    if (existing.checkOutAt) throw new BadRequestException('Already checked out today');

    const record = await this.prisma.attendanceRecord.update({
      where: { id: existing.id },
      data: { checkOutAt: new Date(), checkOutLat: dto.lat, checkOutLng: dto.lng, updatedBy: user.id },
    });
    await this.audit.record({
      tenantId: tid,
      actorId: user.id,
      action: 'attendance.checkOut',
      entityType: 'AttendanceRecord',
      entityId: record.id,
    });
    return record;
  }

  async list(tenantId: string | null, query: QueryAttendanceDto): Promise<Paginated<unknown>> {
    const tid = this.requireTenant(tenantId);
    const { page, pageSize } = normalizePagination(query);

    const where: Prisma.AttendanceRecordWhereInput = {
      tenantId: tid,
      deletedAt: null,
      ...(query.employeeId ? { employeeId: query.employeeId } : {}),
      ...(query.dateFrom || query.dateTo
        ? {
            date: {
              ...(query.dateFrom ? { gte: new Date(query.dateFrom) } : {}),
              ...(query.dateTo ? { lte: new Date(query.dateTo) } : {}),
            },
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.attendanceRecord.findMany({
        where,
        orderBy: { date: query.sortOrder },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.attendanceRecord.count({ where }),
    ]);

    return { data, meta: buildMeta(page, pageSize, total) };
  }

  private async loadRecord(tenantId: string, id: string) {
    const record = await this.prisma.attendanceRecord.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!record) throw new NotFoundException('Attendance record not found');
    return record;
  }

  /** Employee requests a correction of recorded times (PRD §10.13). */
  async requestCorrection(user: AuthenticatedUser, id: string, dto: RequestCorrectionDto) {
    const tid = this.requireTenant(user.tenantId);
    await this.loadRecord(tid, id);
    const record = await this.prisma.attendanceRecord.update({
      where: { id },
      data: {
        status: 'pending_correction',
        correctionReason: dto.reason,
        proposedCheckInAt: dto.proposedCheckInAt ? new Date(dto.proposedCheckInAt) : null,
        proposedCheckOutAt: dto.proposedCheckOutAt ? new Date(dto.proposedCheckOutAt) : null,
        updatedBy: user.id,
      },
    });
    await this.audit.record({ tenantId: tid, actorId: user.id, action: 'attendance.correction.request', entityType: 'AttendanceRecord', entityId: id });
    return record;
  }

  /** Approve a correction → applies proposed times (PRD §10.13: requires approval). */
  async approveCorrection(user: AuthenticatedUser, id: string) {
    const tid = this.requireTenant(user.tenantId);
    const record = await this.loadRecord(tid, id);
    if (record.status !== 'pending_correction') throw new BadRequestException('No pending correction on this record');
    const updated = await this.prisma.attendanceRecord.update({
      where: { id },
      data: {
        checkInAt: record.proposedCheckInAt ?? record.checkInAt,
        checkOutAt: record.proposedCheckOutAt ?? record.checkOutAt,
        status: 'corrected',
        correctionApprovedBy: user.id,
        proposedCheckInAt: null,
        proposedCheckOutAt: null,
        updatedBy: user.id,
      },
    });
    await this.audit.record({ tenantId: tid, actorId: user.id, action: 'attendance.correction.approve', entityType: 'AttendanceRecord', entityId: id });
    return updated;
  }

  async rejectCorrection(user: AuthenticatedUser, id: string) {
    const tid = this.requireTenant(user.tenantId);
    const record = await this.loadRecord(tid, id);
    if (record.status !== 'pending_correction') throw new BadRequestException('No pending correction on this record');
    const updated = await this.prisma.attendanceRecord.update({
      where: { id },
      data: { status: 'rejected', proposedCheckInAt: null, proposedCheckOutAt: null, correctionApprovedBy: user.id, updatedBy: user.id },
    });
    await this.audit.record({ tenantId: tid, actorId: user.id, action: 'attendance.correction.reject', entityType: 'AttendanceRecord', entityId: id });
    return updated;
  }
}
