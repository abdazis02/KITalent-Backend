import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser, type AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { NotificationService } from './notification.service';
import { SendNotificationDto } from './dto/send-notification.dto';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly service: NotificationService) {}

  @Get()
  @RequirePermissions('notification.read.own')
  @ApiOperation({ summary: 'List my notifications' })
  list(@CurrentUser() user: AuthenticatedUser, @Query() query: PaginationQueryDto) {
    return this.service.list(user.id, query);
  }

  @Get('unread-count')
  @RequirePermissions('notification.read.own')
  @ApiOperation({ summary: 'Count my unread notifications' })
  async unread(@CurrentUser() user: AuthenticatedUser) {
    return { unread: await this.service.unreadCount(user.id) };
  }

  @Post(':id/read')
  @RequirePermissions('notification.update.own')
  @ApiOperation({ summary: 'Mark a notification read' })
  read(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.markRead(user.id, id);
  }

  @Post('read-all')
  @RequirePermissions('notification.update.own')
  @ApiOperation({ summary: 'Mark all my notifications read' })
  readAll(@CurrentUser() user: AuthenticatedUser) {
    return this.service.markAllRead(user.id);
  }

  @Post()
  @RequirePermissions('notification.create.tenant')
  @ApiOperation({ summary: 'Send a notification to a user (admin)' })
  send(@CurrentTenant() tenantId: string | null, @Body() dto: SendNotificationDto) {
    return this.service.send(tenantId, dto);
  }
}
