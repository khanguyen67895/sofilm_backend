import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Maps the first path segment of an incoming request to the downstream
 * service base URL that owns it. The gateway forwards the request's full
 * original path unchanged — each service's own controller prefixes (e.g.
 * movie-service mounts `/movies`, `/genres`, `/actors`, ...) are the single
 * source of truth for routing, so adding a new service is just one more
 * entry here, not a rewrite of path rules.
 */
@Injectable()
export class ProxyConfigService {
  private readonly routeMap: Record<string, string | undefined>;

  constructor(config: ConfigService) {
    const auth = config.get<string>('AUTH_SERVICE_URL');
    const user = config.get<string>('USER_SERVICE_URL');
    const movie = config.get<string>('MOVIE_SERVICE_URL');
    const video = config.get<string>('VIDEO_SERVICE_URL');
    const search = config.get<string>('SEARCH_SERVICE_URL');
    const history = config.get<string>('HISTORY_SERVICE_URL');
    const recommendation = config.get<string>('RECOMMENDATION_SERVICE_URL');
    const payment = config.get<string>('PAYMENT_SERVICE_URL');
    const notification = config.get<string>('NOTIFICATION_SERVICE_URL');

    this.routeMap = {
      auth,
      users: user,
      favorites: user,
      settings: user,
      movies: movie,
      genres: movie,
      categories: movie,
      countries: movie,
      tags: movie,
      actors: movie,
      directors: movie,
      banners: movie,
      videos: video,
      shorts: video,
      search,
      history,
      recommendations: recommendation,
      subscriptions: payment,
      payments: payment,
      coupons: payment,
      notifications: notification,
    };
  }

  resolve(firstSegment: string): string | undefined {
    return this.routeMap[firstSegment];
  }
}
