import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { paginate, PaginatedResult, PaginationQueryDto } from '@app/common';
import { Short } from '../entities/short.entity';
import { ShortLike } from '../entities/short-like.entity';
import { Video } from '../entities/video.entity';
import { CreateShortDto } from './dto/create-short.dto';

export interface ShortDto {
  id: string;
  title: string;
  videoUrl: string;
  thumbnail: string;
  movieSlug: string;
  likes: number;
  comments: number;
  isLiked: boolean;
}

@Injectable()
export class ShortsService {
  constructor(
    @InjectRepository(Short) private readonly shorts: Repository<Short>,
    @InjectRepository(ShortLike) private readonly shortLikes: Repository<ShortLike>,
    @InjectRepository(Video) private readonly videos: Repository<Video>,
  ) {}

  async feed(
    userId: string | undefined,
    query: PaginationQueryDto,
  ): Promise<PaginatedResult<ShortDto>> {
    const [items, total] = await this.shorts.findAndCount({
      where: { isActive: true },
      relations: ['video'],
      order: { createdAt: 'DESC' },
      skip: query.skip,
      take: query.limit,
    });

    const likedIds = userId
      ? new Set(
          (
            await this.shortLikes.find({
              where: { userId, shortId: In(items.map((s) => s.id)) },
            })
          ).map((l) => l.shortId),
        )
      : new Set<string>();

    const hydrated: ShortDto[] = items.map((s) => ({
      id: s.id,
      title: s.title,
      videoUrl: s.video?.hlsMasterPlaylistUrl ?? '',
      thumbnail: s.video?.thumbnailUrl ?? '',
      movieSlug: s.movieSlug,
      likes: s.likesCount,
      comments: s.commentsCount,
      isLiked: likedIds.has(s.id),
    }));

    return paginate(hydrated, total, query.page, query.limit);
  }

  /** Idempotent — no-op if already liked. */
  async like(userId: string, shortId: string): Promise<{ liked: boolean }> {
    const existing = await this.shortLikes.findOne({ where: { userId, shortId } });
    if (!existing) {
      await this.shortLikes.save(this.shortLikes.create({ userId, shortId }));
      await this.shorts.increment({ id: shortId }, 'likesCount', 1);
    }
    return { liked: true };
  }

  async unlike(userId: string, shortId: string): Promise<{ liked: boolean }> {
    const existing = await this.shortLikes.findOne({ where: { userId, shortId } });
    if (existing) {
      await this.shortLikes.delete({ userId, shortId });
      await this.shorts.decrement({ id: shortId }, 'likesCount', 1);
    }
    return { liked: false };
  }

  async create(dto: CreateShortDto): Promise<Short> {
    const video = await this.videos.findOneBy({ id: dto.videoId });
    if (!video) throw new NotFoundException(`Video "${dto.videoId}" not found`);

    return this.shorts.save(
      this.shorts.create({
        title: dto.title,
        video,
        movieSlug: dto.movieSlug,
      }),
    );
  }
}
