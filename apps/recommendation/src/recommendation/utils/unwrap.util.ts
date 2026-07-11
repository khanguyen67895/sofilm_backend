/**
 * Every SoFilm service wraps its responses via the shared TransformInterceptor
 * as `{ success, data, message, timestamp }` (see libs/common/src/interceptors/transform.interceptor.ts).
 * When this service calls movie-service / history-service over HTTP it gets
 * that envelope back, so unwrap it defensively — falling back to the raw
 * payload if a downstream response is ever a bare array/object instead.
 */
export function unwrap<T>(payload: unknown): T {
  if (payload && typeof payload === 'object' && 'data' in (payload as Record<string, unknown>)) {
    return (payload as { data: T }).data;
  }
  return payload as T;
}
