import { Injectable } from '@nestjs/common';
import { RecommendationContext, RecommendationStrategy } from './recommendation-strategy.interface';
import { CollaborativeFilteringStrategy } from './collaborative-filtering.strategy';
import { ContentBasedStrategy } from './content-based.strategy';

/**
 * Hybrid strategy — the active default for this service (see
 * RecommendationService, which injects HybridStrategy directly).
 *
 * Real impl: a weighted blend of the collaborative + content-based scores
 * (e.g. `0.6 * collaborativeScore + 0.4 * contentScore`), tuned/A-B tested
 * over time, instead of naive interleaving of two independently-ranked lists.
 *
 * Placeholder impl: run both strategies concurrently and interleave their
 * results 1-for-1, de-duplicating by movie id, so both signals genuinely
 * contribute to the final order even without a real scoring model yet.
 */
@Injectable()
export class HybridStrategy implements RecommendationStrategy {
  constructor(
    private readonly collaborativeFiltering: CollaborativeFilteringStrategy,
    private readonly contentBased: ContentBasedStrategy,
  ) {}

  async recommend(context: RecommendationContext): Promise<any[]> {
    const [collaborative, content] = await Promise.all([
      this.collaborativeFiltering.recommend(context),
      this.contentBased.recommend(context),
    ]);

    const seen = new Set<string>();
    const merged: any[] = [];
    const max = Math.max(collaborative.length, content.length);
    for (let i = 0; i < max && merged.length < context.limit; i++) {
      for (const candidate of [content[i], collaborative[i]]) {
        if (candidate?.id && !seen.has(candidate.id) && merged.length < context.limit) {
          seen.add(candidate.id);
          merged.push(candidate);
        }
      }
    }
    return merged;
  }

  async rerank(items: any[], context: RecommendationContext): Promise<any[]> {
    // Genre overlap is inherently a content-based signal — delegate rather than
    // duplicate it. The collaborative placeholder has no reranking signal of
    // its own yet (see collaborative-filtering.strategy.ts); a real hybrid
    // would blend both strategies' per-item scores here instead of delegating.
    return this.contentBased.rerank(items, context);
  }
}
