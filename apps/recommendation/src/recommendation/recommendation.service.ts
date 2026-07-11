import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { RedisService } from '@app/redis';
import { HybridStrategy } from './strategies/hybrid.strategy';
import { unwrap } from './utils/unwrap.util';

/** ~10 minutes — short enough that a fresh like/watch shows up reasonably
 * soon, long enough to spare movie-service/history-service from being hit on
 * every page load. */
const CACHE_TTL_SECONDS = 600;

@Injectable()
export class RecommendationService {
  private readonly logger = new Logger(RecommendationService.name);
  private readonly movieServiceUrl: string;
  private readonly historyServiceUrl: string;

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
    private readonly redis: RedisService,
    // Hybrid is the one active strategy for now — swap this single injection
    // point to CollaborativeFilteringStrategy/ContentBasedStrategy (or make it
    // configurable) without touching the controller.
    private readonly strategy: HybridStrategy,
  ) {
    this.movieServiceUrl = this.config.get<string>('MOVIE_SERVICE_URL') ?? 'http://localhost:3003';
    this.historyServiceUrl =
      this.config.get<string>('HISTORY_SERVICE_URL') ?? 'http://localhost:3006';
  }

  private authConfig(authHeader?: string) {
    return authHeader ? { headers: { Authorization: authHeader } } : {};
  }

  private async getLikedMovieIds(authHeader?: string): Promise<string[]> {
    try {
      const { data } = await firstValueFrom(
        this.http.get(`${this.historyServiceUrl}/history/likes`, this.authConfig(authHeader)),
      );
      const likes = unwrap<any[]>(data) ?? [];
      return likes.map((like) => like?.movieId ?? like?.movie?.id ?? like?.id).filter(Boolean);
    } catch (err: any) {
      this.logger.warn(`Failed to fetch liked movies from history-service: ${err?.message}`);
      return [];
    }
  }

  async becauseYouWatched(
    userId: string,
    authHeader?: string,
  ): Promise<{ basedOn: any; items: any[] }> {
    const cacheKey = `reco:because-you-watched:${userId}`;
    const cached = await this.redis.getJson<{ basedOn: any; items: any[] }>(cacheKey);
    if (cached) return cached;

    const recent = await this.getMostRecentWatch(authHeader);
    const slug = recent?.movie?.slug ?? recent?.movieSlug ?? recent?.slug;

    let result: { basedOn: any; items: any[] };
    if (!slug) {
      result = { basedOn: null, items: [] };
    } else {
      const { data } = await firstValueFrom(
        this.http.get(`${this.movieServiceUrl}/movies/${slug}/recommend`, {
          params: { limit: 12 },
        }),
      );
      result = { basedOn: recent?.movie ?? recent, items: unwrap<any[]>(data) ?? [] };
    }

    await this.redis.setJson(cacheKey, result, CACHE_TTL_SECONDS);
    return result;
  }

  private async getMostRecentWatch(authHeader?: string): Promise<any | null> {
    try {
      const { data } = await firstValueFrom(
        this.http.get(`${this.historyServiceUrl}/history/continue-watching`, {
          params: { limit: 1 },
          ...this.authConfig(authHeader),
        }),
      );
      const items = unwrap<any[]>(data) ?? [];
      if (items[0]) return items[0];
    } catch (err: any) {
      this.logger.warn(`continue-watching lookup failed: ${err?.message}`);
    }

    try {
      const { data } = await firstValueFrom(
        this.http.get(`${this.historyServiceUrl}/history/watched`, {
          params: { limit: 1 },
          ...this.authConfig(authHeader),
        }),
      );
      const items = unwrap<any[]>(data) ?? [];
      return items[0] ?? null;
    } catch (err: any) {
      this.logger.warn(`watched lookup failed: ${err?.message}`);
      return null;
    }
  }

  async topPicks(userId: string, authHeader?: string): Promise<any[]> {
    const cacheKey = `reco:top-picks:${userId}`;
    const cached = await this.redis.getJson<any[]>(cacheKey);
    if (cached) return cached;

    const likedMovieIds = await this.getLikedMovieIds(authHeader);
    const items = await this.strategy.recommend({ userId, authHeader, likedMovieIds, limit: 20 });

    await this.redis.setJson(cacheKey, items, CACHE_TTL_SECONDS);
    return items;
  }

  async trendingForYou(userId: string, authHeader?: string): Promise<any[]> {
    const cacheKey = `reco:trending-for-you:${userId}`;
    const cached = await this.redis.getJson<any[]>(cacheKey);
    if (cached) return cached;

    const likedMovieIds = await this.getLikedMovieIds(authHeader);
    const { data } = await firstValueFrom(
      this.http.get(`${this.movieServiceUrl}/movies/trending`, { params: { limit: 30 } }),
    );
    const trending = unwrap<any[]>(data) ?? [];

    const items = await this.strategy.rerank(trending, {
      userId,
      authHeader,
      likedMovieIds,
      limit: 20,
    });

    await this.redis.setJson(cacheKey, items, CACHE_TTL_SECONDS);
    return items;
  }

  /** Thin passthrough. history-service remains the source of truth for
   * continue-watching (it changes on every playback tick), so this is
   * intentionally NOT cached here — caching would make it go stale almost
   * immediately. It's exposed on this controller only so clients have a
   * single "recommendations" surface to call, per the spec. */
  async continueWatching(
    authHeader: string | undefined,
    query: Record<string, unknown>,
  ): Promise<any[]> {
    const { data } = await firstValueFrom(
      this.http.get(`${this.historyServiceUrl}/history/continue-watching`, {
        params: query,
        ...this.authConfig(authHeader),
      }),
    );
    return unwrap<any[]>(data) ?? [];
  }
}
