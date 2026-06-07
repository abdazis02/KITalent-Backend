import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { buildMeta, normalizePagination, type Paginated, type PaginationQuery } from '@kitalent/shared';
import { PrismaService } from '../../prisma/prisma.service';

export interface NotifyInput {
  tenantId?: string | null;
  recipientUserId: string;
  event: string;
  title: string;
  body?: string;
  data?: Record<string, unknown>;
}

/**
 * In-app notifications (PRD §10.28). Other modules call `notify()` on key events
 * (approvals, payroll published, …). Push/email channels plug in here later.
 */
@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(private readonly prisma: PrismaService) {}

  async notify(input: NotifyInput): Promise<void> {
    try {
      await this.prisma.notification.create({
        data: {
          tenantId: input.tenantId ?? null,
          recipientUserId: input.recipientUserId,
          event: input.event,
          title: input.title,
          body: input.body,
          data: (input.data ?? {}) as object,
        },
      });
    } catch (err) {
      // Never let a notification failure break the primary operation.
      this.logger.error(`Failed to create notification "${input.event}"`, err as Error);
    }
  }

  async list(userId: string, query: PaginationQuery): Promise<Paginated<unknown>> {
    const { page, pageSize } = normalizePagination(query);
    const where = { recipientUserId: userId };
    const [data, total] = await Promise.all([
      this.prisma.notification.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }),
      this.prisma.notification.count({ where }),
    ]);
    return { data, meta: buildMeta(page, pageSize, total) };
  }

  unreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({ where: { recipientUserId: userId, readAt: null } });
  }

  async markRead(userId: string, id: string) {
    const notification = await this.prisma.notification.findFirst({ where: { id, recipientUserId: userId } });
    if (!notification) throw new NotFoundException('Notification not found');
    return this.prisma.notification.update({ where: { id }, data: { readAt: notification.readAt ?? new Date() } });
  }

  async markAllRead(userId: string) {
    const res = await this.prisma.notification.updateMany({ where: { recipientUserId: userId, readAt: null }, data: { readAt: new Date() } });
    return { updated: res.count };
  }

  /** Admin-initiated send to a specific user within the tenant. */
  async send(actorTenantId: string | null, dto: { recipientUserId: string; title: string; body?: string; event?: string; data?: Record<string, unknown> }) {
    if (!actorTenantId) throw new ForbiddenException('A tenant context is required');
    const recipient = await this.prisma.user.findFirst({ where: { id: dto.recipientUserId, tenantId: actorTenantId, deletedAt: null }, select: { id: true } });
    if (!recipient) throw new NotFoundException('Recipient not found in this tenant');
    await this.notify({ tenantId: actorTenantId, recipientUserId: dto.recipientUserId, event: dto.event ?? 'manual', title: dto.title, body: dto.body, data: dto.data });
    return { sent: true };
  }
}
