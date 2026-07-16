import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

export interface ResolvedVideo {
  videoUrl?: string;
  thumbnailUrl?: string;
}

/**
 * Video is owned by video-service's own database — Movie/Episode only store a
 * bare `videoId` string. This resolves those ids to playable URLs (and their
 * thumbnail, e.g. for episodes — which have no other way to pick up a real
 * thumbnail, unlike Movie's own explicit admin-set poster/backdrop) by
 * calling video-service's public `GET /videos/:id`, in parallel, degrading
 * gracefully (missing fields) per-id rather than failing the whole response.
 */
@Injectable()
export class VideoResolverService {
  private readonly logger = new Logger(VideoResolverService.name);

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {}

  async resolveMany(videoIds: string[]): Promise<Map<string, ResolvedVideo>> {
    const ids = [...new Set(videoIds)].filter(Boolean);
    const result = new Map<string, ResolvedVideo>();
    if (!ids.length) return result;

    const baseUrl = this.config.get<string>('VIDEO_SERVICE_URL') ?? 'http://localhost:3004';

    const settled = await Promise.allSettled(
      ids.map((id) => firstValueFrom(this.http.get(`${baseUrl}/videos/${id}`))),
    );

    settled.forEach((res, i) => {
      if (res.status !== 'fulfilled') {
        const reason = res.reason as Error;
        this.logger.warn(`Failed to resolve video "${ids[i]}": ${reason?.message}`);
        return;
      }
      const video = res.value.data?.data ?? res.value.data;
      if (video?.hlsMasterPlaylistUrl || video?.thumbnailUrl) {
        result.set(ids[i], {
          videoUrl: video?.hlsMasterPlaylistUrl,
          thumbnailUrl: video?.thumbnailUrl,
        });
      }
    });

    return result;
  }
}
