import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { PaginatedResult, PaginationQueryDto, paginate } from '@app/common';
import { WatchProgress } from '../entities/watch-progress.entity';
import { UpsertProgressDto } from './dto/upsert-progress.dto';
import { MovieHydrationService } from './movie-hydration.service';

const COMPLETION_THRESHOLD_SECONDS = 30;

@Injectable()
export class HistoryService {
  constructor(
    @InjectRepository(WatchProgress) private readonly progress: Repository<WatchProgress>,
    private readonly hydration: MovieHydrationService,
  ) {}

  async upsertProgress(userId: string, dto: UpsertProgressDto): Promise<WatchProgress> {
    const episodeId = dto.episodeId ?? null;

    let row = await this.progress.findOne({
      where: {
        userId,
        movieId: dto.movieId,
        episodeId: episodeId ?? IsNull(),
      },
    });

    const completed =
      dto.durationSeconds != null &&
      dto.positionSeconds >= dto.durationSeconds - COMPLETION_THRESHOLD_SECONDS;

    if (!row) {
      row = this.progress.create({
        userId,
        movieId: dto.movieId,
        episodeId,
      });
    }

    row.positionSeconds = dto.positionSeconds;
    if (dto.durationSeconds != null) row.durationSeconds = dto.durationSeconds;
    row.completed = completed;
    row.lastWatchedAt = new Date();

    return this.progress.save(row);
  }

  async continueWatching(userId: string, query: PaginationQueryDto): Promise<PaginatedResult<any>> {
    const [items, total] = await this.progress.findAndCount({
      where: { userId, completed: false },
      order: { lastWatchedAt: 'DESC' },
      skip: query.skip,
      take: query.limit,
    });

    const movieById = await this.hydration.hydrate(items.map((item) => item.movieId));

    const hydrated = items.map((item) => ({
      movie: movieById[item.movieId],
      episodeId: item.episodeId,
      positionSeconds: item.positionSeconds,
      durationSeconds: item.durationSeconds,
      lastWatchedAt: item.lastWatchedAt,
    }));

    return paginate(hydrated, total, query.page, query.limit);
  }

  async watched(
    userId: string,
    query: PaginationQueryDto,
  ): Promise<PaginatedResult<WatchProgress>> {
    const [items, total] = await this.progress.findAndCount({
      where: { userId, completed: true },
      order: { lastWatchedAt: 'DESC' },
      skip: query.skip,
      take: query.limit,
    });

    return paginate(items, total, query.page, query.limit);
  }
}
