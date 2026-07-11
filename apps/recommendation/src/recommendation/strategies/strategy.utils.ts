import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { unwrap } from '../utils/unwrap.util';

/** Shared HTTP + scoring helpers used by all three strategy placeholders below.
 * None of this is strategy-specific logic — it's just wiring to movie-service —
 * so it's factored out to keep each strategy file focused on its own heuristic. */

export async function fetchTrending(
  http: HttpService,
  movieServiceUrl: string,
  limit: number,
): Promise<any[]> {
  const { data } = await firstValueFrom(
    http.get(`${movieServiceUrl}/movies/trending`, { params: { limit } }),
  );
  return unwrap<any[]>(data) ?? [];
}

export async function fetchSimilarTo(
  http: HttpService,
  movieServiceUrl: string,
  slug: string,
  limit: number,
): Promise<any[]> {
  const { data } = await firstValueFrom(
    http.get(`${movieServiceUrl}/movies/${slug}/recommend`, { params: { limit } }),
  );
  return unwrap<any[]>(data) ?? [];
}

export async function hydrateMovies(
  http: HttpService,
  movieServiceUrl: string,
  ids: string[],
): Promise<any[]> {
  if (!ids.length) return [];
  const { data } = await firstValueFrom(http.post(`${movieServiceUrl}/movies/batch`, { ids }));
  return unwrap<any[]>(data) ?? [];
}

export function extractGenreIds(movies: any[]): Set<string> {
  const ids = new Set<string>();
  movies.forEach((movie) =>
    (movie?.genres ?? []).forEach((genre: any) => genre?.id && ids.add(genre.id)),
  );
  return ids;
}

/** Stable "boost matches to the front, keep the rest in original order" re-rank. */
export function boostByGenreOverlap(items: any[], likedGenreIds: Set<string>): any[] {
  return items
    .map((item, index) => ({
      item,
      index,
      score: (item?.genres ?? []).filter((genre: any) => likedGenreIds.has(genre?.id)).length,
    }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((entry) => entry.item);
}

/** Deterministic per-user rotation — a placeholder stand-in for a real
 * personalized ordering until an actual interaction-matrix model exists. */
export function seededRotate<T>(items: T[], seed: string): T[] {
  if (!items.length) return items;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  const offset = hash % items.length;
  return [...items.slice(offset), ...items.slice(0, offset)];
}
