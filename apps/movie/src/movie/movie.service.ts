import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, In, Repository, type WhereExpressionBuilder } from 'typeorm';
import { paginate, PaginatedResult, PaginationQueryDto, slugify } from '@app/common';
import { RedisService } from '@app/redis';
import { NotificationBroadcastService } from './notification-broadcast.service';
import { Movie, MovieType } from '../entities/movie.entity';
import { Episode } from '../entities/episode.entity';
import { Genre } from '../entities/genre.entity';
import { Category } from '../entities/category.entity';
import { Country } from '../entities/country.entity';
import { Tag } from '../entities/tag.entity';
import { Actor } from '../entities/actor.entity';
import { Director } from '../entities/director.entity';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { MovieQueryDto } from './dto/movie-query.dto';
import { VideoResolverService } from './video-resolver.service';
import { EntitlementService } from './entitlement.service';

type WithVideoUrl<T> = T & { videoUrl?: string };
type WithAccess<T> = T & { hasAccess?: boolean };

const TRENDING_CACHE_KEY = 'movies:trending';
const TRENDING_CACHE_TTL = 60;

/** A series with no playable episode yet is a dead end for viewers (no video,
 * empty episode list) — every public-facing query excludes it. MOVIE rows are
 * unaffected (they carry their own videoId). Admin listings deliberately skip
 * this filter so incomplete series stay manageable. */
const PUBLIC_VISIBILITY_SQL = `(
  movie.type != 'SERIES' OR EXISTS (
    SELECT 1 FROM episodes e
    INNER JOIN seasons s ON s.id = e.season_id
    WHERE s.movie_id = movie.id AND e."videoId" IS NOT NULL
  )
)`;

@Injectable()
export class MovieService {
  constructor(
    @InjectRepository(Movie) private readonly movies: Repository<Movie>,
    @InjectRepository(Genre) private readonly genres: Repository<Genre>,
    @InjectRepository(Category) private readonly categories: Repository<Category>,
    @InjectRepository(Country) private readonly countries: Repository<Country>,
    @InjectRepository(Tag) private readonly tags: Repository<Tag>,
    @InjectRepository(Actor) private readonly actors: Repository<Actor>,
    @InjectRepository(Director) private readonly directors: Repository<Director>,
    private readonly redis: RedisService,
    private readonly videoResolver: VideoResolverService,
    private readonly entitlement: EntitlementService,
    private readonly notificationBroadcast: NotificationBroadcastService,
  ) {}

  async create(dto: CreateMovieDto): Promise<Movie> {
    const movie = this.movies.create({
      title: dto.title,
      slug: dto.slug ? slugify(dto.slug) : slugify(dto.title),
      description: dto.description,
      poster: dto.poster,
      backdrop: dto.backdrop,
      type: dto.type,
      releaseDate: dto.releaseDate,
      duration: dto.duration,
      isPremium: dto.isPremium ?? false,
      videoId: dto.videoId,
    });

    if (dto.countryId) {
      movie.country = (await this.countries.findOneBy({ id: dto.countryId })) ?? undefined;
    }
    if (dto.genreIds?.length) movie.genres = await this.genres.findBy({ id: In(dto.genreIds) });
    if (dto.categoryIds?.length)
      movie.categories = await this.categories.findBy({ id: In(dto.categoryIds) });
    if (dto.tagIds?.length) movie.tags = await this.tags.findBy({ id: In(dto.tagIds) });
    if (dto.actorIds?.length) movie.actors = await this.actors.findBy({ id: In(dto.actorIds) });
    if (dto.directorIds?.length)
      movie.directors = await this.directors.findBy({ id: In(dto.directorIds) });

    const saved = await this.movies.save(movie);

    // A MOVIE is playable the moment it's created (poster/video are required
    // up front) — a SERIES isn't visible to anyone until its first episode
    // lands (see PUBLIC_VISIBILITY_SQL), so that one is announced from
    // EpisodeService.create() instead, not here.
    if (saved.type === MovieType.MOVIE) {
      await this.notificationBroadcast.notifyNewContent(
        `Phim mới: ${saved.title}`,
        saved.description || 'Phim mới vừa được thêm vào SoFilm.',
        { thumbnail: saved.poster, link: `/movie/${saved.slug}` },
      );
    }

    return saved;
  }

  async findBySlug(slug: string, authHeader?: string): Promise<Movie> {
    const movie = await this.movies.findOne({
      where: { slug },
      relations: ['seasons', 'seasons.episodes', 'actors', 'directors'],
    });
    if (!movie) throw new NotFoundException(`Movie "${slug}" not found`);

    const entitled = movie.isPremium
      ? await this.entitlement.hasActiveSubscription(authHeader)
      : true;
    return this.withVideoUrls(movie, entitled);
  }

  async findById(id: string): Promise<Movie> {
    const movie = await this.movies.findOne({
      where: { id },
      relations: ['seasons', 'seasons.episodes', 'actors', 'directors'],
    });
    if (!movie) throw new NotFoundException(`Movie "${id}" not found`);
    return this.withVideoUrls(movie);
  }

  /**
   * Response-shaping step: resolves videoId -> playable URL for a movie and all its
   * episodes, unless `entitled` is false — in that case no video-service call is made
   * at all and no videoUrl fields are set, so premium content is never sent to a
   * caller without an active subscription. `hasAccess` is always set so the frontend
   * can render a paywall deterministically.
   */
  private async withVideoUrls(movie: Movie, entitled = true): Promise<Movie> {
    (movie as WithAccess<Movie>).hasAccess = entitled;
    if (!entitled) return movie;

    const ids = new Set<string>();
    if (movie.type === MovieType.MOVIE && movie.videoId) ids.add(movie.videoId);
    for (const season of movie.seasons ?? []) {
      for (const episode of season.episodes ?? []) {
        if (episode.videoId) ids.add(episode.videoId);
      }
    }
    if (!ids.size) return movie;

    const resolved = await this.videoResolver.resolveMany([...ids]);

    if (movie.videoId)
      (movie as WithVideoUrl<Movie>).videoUrl = resolved.get(movie.videoId)?.videoUrl;
    for (const season of movie.seasons ?? []) {
      for (const episode of season.episodes ?? []) {
        if (episode.videoId) {
          const video = resolved.get(episode.videoId);
          (episode as WithVideoUrl<Episode>).videoUrl = video?.videoUrl;
          // Episodes have no admin-set poster equivalent (unlike Movie's own
          // poster/backdrop) — fall back to the video's own generated
          // thumbnail so the episode list never shows a blank box.
          episode.thumbnail = video?.thumbnailUrl ?? episode.thumbnail;
        }
      }
    }

    return movie;
  }

  async update(id: string, dto: UpdateMovieDto): Promise<Movie> {
    const movie = await this.findById(id);

    Object.assign(movie, {
      ...(dto.title !== undefined && { title: dto.title }),
      ...(dto.slug !== undefined && { slug: slugify(dto.slug) }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.poster !== undefined && { poster: dto.poster }),
      ...(dto.backdrop !== undefined && { backdrop: dto.backdrop }),
      ...(dto.type !== undefined && { type: dto.type }),
      ...(dto.releaseDate !== undefined && { releaseDate: dto.releaseDate }),
      ...(dto.duration !== undefined && { duration: dto.duration }),
      ...(dto.isPremium !== undefined && { isPremium: dto.isPremium }),
      ...(dto.videoId !== undefined && { videoId: dto.videoId }),
    });

    if (dto.countryId) {
      movie.country = (await this.countries.findOneBy({ id: dto.countryId })) ?? undefined;
    }
    if (dto.genreIds) movie.genres = await this.genres.findBy({ id: In(dto.genreIds) });
    if (dto.categoryIds)
      movie.categories = await this.categories.findBy({ id: In(dto.categoryIds) });
    if (dto.tagIds) movie.tags = await this.tags.findBy({ id: In(dto.tagIds) });
    if (dto.actorIds) movie.actors = await this.actors.findBy({ id: In(dto.actorIds) });
    if (dto.directorIds) movie.directors = await this.directors.findBy({ id: In(dto.directorIds) });

    return this.movies.save(movie);
  }

  async remove(id: string): Promise<void> {
    const movie = await this.findById(id);
    await this.movies.softRemove(movie);
  }

  async adminList(query: PaginationQueryDto): Promise<PaginatedResult<Movie>> {
    const [items, total] = await this.movies.findAndCount({
      order: { createdAt: 'DESC' },
      skip: query.skip,
      take: query.limit,
    });
    return paginate(items, total, query.page, query.limit);
  }

  async batchByIds(ids: string[]): Promise<Movie[]> {
    if (!ids?.length) return [];
    return this.movies.findBy({ id: In(ids) });
  }

  /** Cheap "trending" — all-time views, cached in Redis for a minute.
   * TODO(recommendation-service): replace with a rolling-window view-event score. */
  async trending(limit = 20): Promise<Movie[]> {
    const cached = await this.redis.getJson<Movie[]>(TRENDING_CACHE_KEY);
    if (cached) return cached.slice(0, limit);

    const movies = await this.movies
      .createQueryBuilder('movie')
      .andWhere(PUBLIC_VISIBILITY_SQL)
      .orderBy('movie.trendingScore', 'DESC')
      .take(limit)
      .getMany();
    await this.redis.setJson(TRENDING_CACHE_KEY, movies, TRENDING_CACHE_TTL);
    return movies;
  }

  async latest(limit = 20): Promise<Movie[]> {
    return this.movies
      .createQueryBuilder('movie')
      .andWhere(PUBLIC_VISIBILITY_SQL)
      .orderBy('movie.createdAt', 'DESC')
      .take(limit)
      .getMany();
  }

  async topView(limit = 20): Promise<Movie[]> {
    return this.movies
      .createQueryBuilder('movie')
      .andWhere(PUBLIC_VISIBILITY_SQL)
      .orderBy('movie.views', 'DESC')
      .take(limit)
      .getMany();
  }

  /** Same-genre heuristic — recommendation-service owns the smarter version of this. */
  async recommend(slug: string, limit = 12): Promise<Movie[]> {
    const movie = await this.findBySlug(slug);
    const genreIds = movie.genres?.map((g) => g.id) ?? [];
    if (!genreIds.length) return this.topView(limit);

    return this.movies
      .createQueryBuilder('movie')
      .innerJoin('movie.genres', 'genre')
      .where('genre.id IN (:...genreIds)', { genreIds })
      .andWhere('movie.id != :id', { id: movie.id })
      .andWhere(PUBLIC_VISIBILITY_SQL)
      .orderBy('movie.rating', 'DESC')
      .take(limit)
      .getMany();
  }

  /** Public paginated browse — optionally filtered by genre slug (used by the
   * category page's genre filter pills). */
  async list(query: MovieQueryDto): Promise<PaginatedResult<Movie>> {
    const qb = this.movies
      .createQueryBuilder('movie')
      .andWhere(PUBLIC_VISIBILITY_SQL)
      .orderBy('movie.createdAt', 'DESC');

    if (query.genre) {
      qb.innerJoin('movie.genres', 'genre').andWhere('genre.slug = :genre', {
        genre: query.genre,
      });
    }

    const [items, total] = await qb.skip(query.skip).take(query.limit).getManyAndCount();
    return paginate(items, total, query.page, query.limit);
  }

  async byCategory(
    categorySlug: string,
    query: PaginationQueryDto,
  ): Promise<PaginatedResult<Movie>> {
    const [items, total] = await this.movies
      .createQueryBuilder('movie')
      .innerJoin('movie.categories', 'category')
      .where('category.slug = :categorySlug', { categorySlug })
      .andWhere(PUBLIC_VISIBILITY_SQL)
      .skip(query.skip)
      .take(query.limit)
      .getManyAndCount();

    return paginate(items, total, query.page, query.limit);
  }

  async search(q: string, query: PaginationQueryDto): Promise<PaginatedResult<Movie>> {
    const [items, total] = await this.movies
      .createQueryBuilder('movie')
      .where(
        new Brackets((qb: WhereExpressionBuilder) => {
          qb.where('movie.title ILIKE :q', { q: `%${q}%` }).orWhere(
            'movie.originalTitle ILIKE :q',
            { q: `%${q}%` },
          );
        }),
      )
      .andWhere(PUBLIC_VISIBILITY_SQL)
      .skip(query.skip)
      .take(query.limit)
      .getManyAndCount();

    return paginate(items, total, query.page, query.limit);
  }

  /** Called by history-service (or the gateway) whenever a watch session starts. */
  async incrementViews(slug: string): Promise<void> {
    await this.movies.increment({ slug }, 'views', 1);
    await this.movies.increment({ slug }, 'trendingScore', 1);
    await this.redis.del(TRENDING_CACHE_KEY);
  }
}
