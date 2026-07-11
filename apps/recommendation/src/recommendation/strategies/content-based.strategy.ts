import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { RecommendationContext, RecommendationStrategy } from './recommendation-strategy.interface';
import {
  boostByGenreOverlap,
  extractGenreIds,
  fetchSimilarTo,
  fetchTrending,
  hydrateMovies,
} from './strategy.utils';

/**
 * Content-Based strategy.
 *
 * Real impl: score candidate movies by genre/tag/actor overlap with the
 * user's liked movies using a vector-similarity model (e.g. TF-IDF over
 * metadata, or learned title embeddings) — a signal that only looks at this
 * user's own taste, independent of what anyone else watched.
 *
 * Placeholder impl: hydrate the user's liked movies via movie-service's
 * POST /movies/batch, then reuse its same-genre `/movies/{slug}/recommend`
 * endpoint (seeded from one liked movie) as a stand-in "content similarity"
 * score. Falls back to trending for cold-start users with no likes yet.
 */
@Injectable()
export class ContentBasedStrategy implements RecommendationStrategy {
  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {}

  private get movieServiceUrl(): string {
    return this.config.get<string>('MOVIE_SERVICE_URL') ?? 'http://localhost:3003';
  }

  async recommend(context: RecommendationContext): Promise<any[]> {
    if (context.likedMovieIds.length) {
      const liked = await hydrateMovies(this.http, this.movieServiceUrl, context.likedMovieIds);
      const seedSlug = liked.find((movie) => movie?.slug)?.slug;
      if (seedSlug) {
        return fetchSimilarTo(this.http, this.movieServiceUrl, seedSlug, context.limit);
      }
    }
    return fetchTrending(this.http, this.movieServiceUrl, context.limit);
  }

  async rerank(items: any[], context: RecommendationContext): Promise<any[]> {
    const liked = await hydrateMovies(this.http, this.movieServiceUrl, context.likedMovieIds);
    const likedGenreIds = extractGenreIds(liked);
    const ranked = likedGenreIds.size ? boostByGenreOverlap(items, likedGenreIds) : items;
    return ranked.slice(0, context.limit);
  }
}
