import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

/** Shared by MovieService (new MOVIE) and EpisodeService (SERIES becoming
 * visible on its first episode) — both need the exact same "announce new
 * content" call, so it lives here once instead of twice. */
@Injectable()
export class NotificationBroadcastService {
  private readonly logger = new Logger(NotificationBroadcastService.name);

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {}

  /** Best-effort — a notification-service hiccup must never block content
   * creation. See NotificationController.broadcast's own doc comment for why
   * this is a same-process-trust @Public() call rather than real internal auth. */
  async notifyNewContent(
    title: string,
    body: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    try {
      const notificationServiceUrl =
        this.config.get<string>('NOTIFICATION_SERVICE_URL') ?? 'http://localhost:3009';
      await firstValueFrom(
        this.http.post(`${notificationServiceUrl}/notifications/broadcast`, {
          title,
          body,
          metadata,
        }),
      );
    } catch (err) {
      this.logger.warn(`Failed to broadcast notification "${title}": ${(err as Error).message}`);
    }
  }
}
