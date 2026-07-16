import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

export interface HydratedUser {
  userId: string;
  displayName: string;
  avatar?: string;
}

/** User profiles live in user-service's own database — reviews only store a bare
 * userId, so this resolves those ids to display name/avatar for the comment feed,
 * degrading gracefully (falls back to an "Anonymous" placeholder) per-id rather than
 * failing the whole reviews response. Mirrors VideoResolverService's shape. */
@Injectable()
export class UserHydrationService {
  private readonly logger = new Logger(UserHydrationService.name);

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {}

  async resolveMany(userIds: string[]): Promise<Map<string, HydratedUser>> {
    const ids = [...new Set(userIds)].filter(Boolean);
    const result = new Map<string, HydratedUser>();
    if (!ids.length) return result;

    const baseUrl = this.config.get<string>('USER_SERVICE_URL') ?? 'http://localhost:3002';

    try {
      const response = await firstValueFrom(this.http.post(`${baseUrl}/users/batch`, { ids }));
      const users: HydratedUser[] = response.data?.data ?? response.data ?? [];
      users.forEach((u) => result.set(u.userId, u));
    } catch (error) {
      this.logger.warn(`Failed to hydrate users: ${(error as Error).message}`);
    }

    return result;
  }
}
