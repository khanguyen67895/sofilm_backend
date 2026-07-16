import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

/** video-service's own copy of the same small "announce new content" call
 * movie-service makes (apps/movie/src/movie/notification-broadcast.service.ts)
 * — kept per-service rather than in a shared lib, matching how this codebase
 * already colocates each service's own cross-service HTTP helpers (see
 * VideoResolverService/EntitlementService in movie-service). */
@Injectable()
export class NotificationBroadcastService {
  private readonly logger = new Logger(NotificationBroadcastService.name);

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {}

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
