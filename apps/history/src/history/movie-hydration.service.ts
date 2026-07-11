import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

/**
 * Shared helper for turning a list of movieIds into full movie objects by
 * calling movie-service's `POST /movies/batch`. Used by continue-watching
 * and likes, both of which degrade gracefully (no `movie` field) if
 * movie-service is unreachable, rather than failing the whole request.
 */
@Injectable()
export class MovieHydrationService {
  private readonly logger = new Logger(MovieHydrationService.name);

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {}

  async hydrate(movieIds: string[]): Promise<Record<string, any>> {
    const ids = [...new Set(movieIds)].filter(Boolean);
    if (!ids.length) return {};

    const baseUrl = this.config.get<string>('MOVIE_SERVICE_URL') ?? 'http://localhost:3003';

    try {
      const { data } = await firstValueFrom(this.http.post(`${baseUrl}/movies/batch`, { ids }));
      const movies: any[] = Array.isArray(data) ? data : (data?.data ?? []);
      return Object.fromEntries(movies.map((movie) => [movie.id, movie]));
    } catch (err) {
      this.logger.warn(`Failed to hydrate movies from movie-service: ${(err as Error).message}`);
      return {};
    }
  }
}
