import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface ChannelMessage {
  recipientUserId: string;
  title: string;
  body?: string;
  data?: Record<string, unknown>;
}

export type ChannelName = 'email' | 'whatsapp' | 'fcm';

/**
 * Multi-channel notification dispatcher (PRD §10.28). The in-app channel is
 * handled by NotificationService (DB row); this fans out to external channels.
 *
 * Each channel is a config-gated extension point: until its credentials are set
 * (SMTP_HOST, WHATSAPP_API_URL, FCM_SERVER_KEY) it logs the intended delivery
 * instead of sending, so the rest of the system is fully wired and testable.
 * Replace the `// TODO real provider` blocks with the actual SDK/HTTP call.
 */
@Injectable()
export class NotificationChannelsService {
  private readonly logger = new Logger(NotificationChannelsService.name);

  constructor(private readonly config: ConfigService) {}

  isEnabled(channel: ChannelName): boolean {
    return this.config.get<boolean>(`channels.${channel}.enabled`) ?? false;
  }

  /** Best-effort fan-out — a channel failure never throws into the caller. */
  async dispatch(channels: ChannelName[], msg: ChannelMessage): Promise<void> {
    await Promise.all(
      channels.map(async (ch) => {
        try {
          switch (ch) {
            case 'email': return await this.email(msg);
            case 'whatsapp': return await this.whatsapp(msg);
            case 'fcm': return await this.fcm(msg);
            default: return;
          }
        } catch (err) {
          this.logger.error(`Channel "${ch}" delivery failed`, err as Error);
        }
      }),
    );
  }

  private async email(msg: ChannelMessage): Promise<void> {
    if (!this.isEnabled('email')) {
      this.logger.debug(`[email:disabled] would notify ${msg.recipientUserId}: ${msg.title}`);
      return;
    }
    // TODO real provider: send via SMTP (nodemailer) using config('channels.email').
    this.logger.log(`[email] notify ${msg.recipientUserId}: ${msg.title}`);
  }

  private async whatsapp(msg: ChannelMessage): Promise<void> {
    if (!this.isEnabled('whatsapp')) {
      this.logger.debug(`[whatsapp:disabled] would notify ${msg.recipientUserId}: ${msg.title}`);
      return;
    }
    // TODO real provider: POST to config('channels.whatsapp.apiUrl') with apiKey.
    this.logger.log(`[whatsapp] notify ${msg.recipientUserId}: ${msg.title}`);
  }

  private async fcm(msg: ChannelMessage): Promise<void> {
    if (!this.isEnabled('fcm')) {
      this.logger.debug(`[fcm:disabled] would notify ${msg.recipientUserId}: ${msg.title}`);
      return;
    }
    // TODO real provider: send via Firebase Admin / FCM HTTP v1 using serverKey.
    this.logger.log(`[fcm] notify ${msg.recipientUserId}: ${msg.title}`);
  }
}
