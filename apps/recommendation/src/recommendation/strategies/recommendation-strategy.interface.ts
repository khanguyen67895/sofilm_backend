export interface RecommendationContext {
  userId: string;
  /** Forwarded verbatim from the caller's incoming request so strategies can
   * make authenticated calls to history-service on the user's behalf. */
  authHeader?: string;
  likedMovieIds: string[];
  limit: number;
}

/**
 * Pluggable recommendation algorithm family. Three concrete implementations
 * exist today (Collaborative Filtering, Content-Based, Hybrid) so the real
 * ML-backed versions can be swapped in later without touching
 * RecommendationController/RecommendationService's public surface.
 */
export interface RecommendationStrategy {
  /** Produce a fresh ranked list of candidate movies for this user. */
  recommend(context: RecommendationContext): Promise<any[]>;

  /** Re-order an already-fetched list (e.g. movie-service's trending feed)
   * to better match this user's taste, without changing its membership. */
  rerank(items: any[], context: RecommendationContext): Promise<any[]>;
}
