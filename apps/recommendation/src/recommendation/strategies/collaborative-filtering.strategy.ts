import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { RecommendationContext, RecommendationStrategy } from './recommendation-strategy.interface';
import { fetchTrending, seededRotate } from './strategy.utils';

/**
 * Collaborative-Filtering strategy.
 *
 * Real impl: build a user-item interaction matrix (likes/watch history across
 * ALL users, not just this one) and use matrix factorization (ALS/SVD) or
 * k-NN over similar users' taste, so "people who liked what you liked also
 * liked X" surfaces even with zero content similarity. That requires an
 * offline/batch job reading history-service data across the whole user base —
 * out of scope for this scaffold.
 *
 * Placeholder impl: fall back to movie-service's global trending list (since
 * without a real interaction matrix, "what similar users liked" degenerates to
 * "what's popular overall"), then rotate it deterministically per user so two
 * different users don't see byte-identical ordering.
 */
@Injectable()
export class CollaborativeFilteringStrategy implements RecommendationStrategy {
  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {}

  private get movieServiceUrl(): string {
    return this.config.get<string>('MOVIE_SERVICE_URL') ?? 'http://localhost:3003';
  }

  async recommend(context: RecommendationContext): Promise<any[]> {
    const trending = await fetchTrending(
      this.http,
      this.movieServiceUrl,
      (context.limit || 20) * 2,
    );
    return seededRotate(trending, context.userId).slice(0, context.limit);
  }

  async rerank(items: any[], context: RecommendationContext): Promise<any[]> {
    // TODO(real impl): re-rank using per-user affinity scores derived from the
    // interaction matrix instead of a deterministic rotation.
    return seededRotate(items, context.userId).slice(0, context.limit);
  }
}
