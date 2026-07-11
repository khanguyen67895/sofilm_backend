import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginatedResult, PaginationQueryDto, paginate } from '@app/common';
import { Like } from '../entities/like.entity';
import { MovieHydrationService } from './movie-hydration.service';

@Injectable()
export class LikeService {
  constructor(
    @InjectRepository(Like) private readonly likes: Repository<Like>,
    private readonly hydration: MovieHydrationService,
  ) {}

  /** Idempotent create — returns the existing row if it's already liked. */
  async like(userId: string, movieId: string): Promise<Like> {
    const existing = await this.likes.findOne({ where: { userId, movieId } });
    if (existing) return existing;

    return this.likes.save(this.likes.create({ userId, movieId }));
  }

  async unlike(userId: string, movieId: string): Promise<void> {
    await this.likes.delete({ userId, movieId });
  }

  async list(userId: string, query: PaginationQueryDto): Promise<PaginatedResult<any>> {
    const [items, total] = await this.likes.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: query.skip,
      take: query.limit,
    });

    const movieById = await this.hydration.hydrate(items.map((item) => item.movieId));

    const hydrated = items.map((item) => ({
      movie: movieById[item.movieId],
      movieId: item.movieId,
      createdAt: item.createdAt,
    }));

    return paginate(hydrated, total, query.page, query.limit);
  }
}
