import { Global, Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationService } from './notification.service';
import { NotificationChannelsService } from './notification-channels.service';

@Global()
@Module({
  controllers: [NotificationsController],
  providers: [NotificationService, NotificationChannelsService],
  exports: [NotificationService, NotificationChannelsService],
})
export class NotificationsModule {}
