import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface AuditEntry {
  tenantId?: string | null;
  actorId?: string | null;
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Central audit log writer (PRD §0.5). Every sensitive action — login/logout,
 * CRUD, approvals, payroll run, invoice/contract generation, exports, role
 * changes — should funnel through here. Failures are swallowed-and-logged so
 * auditing never breaks the primary operation.
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async record(entry: AuditEntry): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          tenantId: entry.tenantId ?? null,
          actorId: entry.actorId ?? null,
          action: entry.action,
          entityType: entry.entityType,
          entityId: entry.entityId,
          metadata: (entry.metadata ?? {}) as object,
          ipAddress: entry.ipAddress,
          userAgent: entry.userAgent,
        },
      });
    } catch (err) {
      this.logger.error(`Failed to write audit log for "${entry.action}"`, err as Error);
    }
  }
}
