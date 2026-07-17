import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CrudService } from '@app/common';
import { Genre } from '../entities/genre.entity';
import { Category } from '../entities/category.entity';
import { Country } from '../entities/country.entity';
import { Tag } from '../entities/tag.entity';
import { Actor } from '../entities/actor.entity';
import { Director } from '../entities/director.entity';
import { Banner } from '../entities/banner.entity';
import { Movie } from '../entities/movie.entity';
import { VideoResolverService } from '../movie/video-resolver.service';
import type { CreateBannerDto, UpdateBannerDto } from './dto/banner.dto';

@Injectable()
export class GenreService extends CrudService<Genre> {
  constructor(@InjectRepository(Genre) repo: Repository<Genre>) {
    super(repo);
  }
}

@Injectable()
export class CategoryService extends CrudService<Category> {
  constructor(@InjectRepository(Category) repo: Repository<Category>) {
    super(repo);
  }
}

@Injectable()
export class CountryService extends CrudService<Country> {
  constructor(@InjectRepository(Country) repo: Repository<Country>) {
    super(repo);
  }
}

@Injectable()
export class TagService extends CrudService<Tag> {
  constructor(@InjectRepository(Tag) repo: Repository<Tag>) {
    super(repo);
  }
}

@Injectable()
export class ActorService extends CrudService<Actor> {
  constructor(@InjectRepository(Actor) repo: Repository<Actor>) {
    super(repo);
  }
}

@Injectable()
export class DirectorService extends CrudService<Director> {
  constructor(@InjectRepository(Director) repo: Repository<Director>) {
    super(repo);
  }
}

@Injectable()
export class BannerService extends CrudService<Banner> {
  constructor(
    @InjectRepository(Banner) repo: Repository<Banner>,
    @InjectRepository(Movie) private readonly movies: Repository<Movie>,
    private readonly videoResolver: VideoResolverService,
  ) {
    super(repo);
  }

  /** Active banners for the public hero — resolves a playable video URL, same
   * as MovieService.withVideoUrls, so the hero can autoplay a clip as its
   * background. The banner's own uploaded video (videoId) takes priority over
   * the linked movie's video, letting admins pick a dedicated hero clip.
   * Capped to the 10 newest so the hero doesn't turn into an ever-growing
   * carousel as admins add more banners over time — the admin's own manual
   * "display order" still decides the sequence within that set of 10. */
  async findActive(): Promise<Banner[]> {
    const now = new Date();
    const banners = await this.repository.find({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
      take: 10,
    });
    const windowed = banners
      .filter((b) => (!b.startAt || b.startAt <= now) && (!b.endAt || b.endAt >= now))
      .sort((a, b) => a.order - b.order);

    const videoIds = windowed
      .map((b) => b.videoId ?? b.movie?.videoId)
      .filter((id): id is string => Boolean(id));

    if (videoIds.length) {
      const resolved = await this.videoResolver.resolveMany(videoIds);
      for (const banner of windowed) {
        const sourceVideoId = banner.videoId ?? banner.movie?.videoId;
        if (sourceVideoId) {
          (banner as Banner & { videoUrl?: string }).videoUrl =
            resolved.get(sourceVideoId)?.videoUrl;
        }
      }
    }

    return windowed;
  }

  /** Admin listing — every banner regardless of isActive/date window, ordered for display/reordering. */
  async findAllOrdered(): Promise<Banner[]> {
    return this.repository.find({ order: { order: 'ASC' } });
  }

  async createBanner(dto: CreateBannerDto): Promise<Banner> {
    const { movieId, ...rest } = dto;
    const banner = this.repository.create(rest);
    if (movieId) banner.movie = await this.movies.findOneByOrFail({ id: movieId });
    return this.repository.save(banner);
  }

  async updateBanner(id: string, dto: UpdateBannerDto): Promise<Banner> {
    const banner = await this.findById(id);
    const { movieId, ...rest } = dto;
    Object.assign(banner, rest);
    if (movieId !== undefined) {
      banner.movie = movieId ? await this.movies.findOneByOrFail({ id: movieId }) : undefined;
    }
    return this.repository.save(banner);
  }
}
