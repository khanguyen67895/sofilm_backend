import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { paginate, PaginatedResult, PaginationQueryDto } from '@app/common';
import { Short } from '../entities/short.entity';
import { ShortLike } from '../entities/short-like.entity';
import { Video } from '../entities/video.entity';
import { CreateShortDto } from './dto/create-short.dto';
import { NotificationBroadcastService } from './notification-broadcast.service';

export interface ShortDto {
  id: string;
  title: string;
  content?: string;
  videoUrl: string;
  thumbnail: string;
  movieSlug?: string;
  likes: number;
  comments: number;
  isLiked: boolean;
}

export interface ShortAdminDto {
  id: string;
  title: string;
  content?: string;
  videoUrl: string;
  thumbnail: string;
  movieSlug?: string;
  likes: number;
  comments: number;
  isActive: boolean;
  createdAt: Date;
}

@Injectable()
export class ShortsService {
  constructor(
    @InjectRepository(Short) private readonly shorts: Repository<Short>,
    @InjectRepository(ShortLike) private readonly shortLikes: Repository<ShortLike>,
    @InjectRepository(Video) private readonly videos: Repository<Video>,
    private readonly notificationBroadcast: NotificationBroadcastService,
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
      content: s.content,
      videoUrl: s.video?.hlsMasterPlaylistUrl ?? '',
      thumbnail: s.thumbnailUrl ?? s.video?.thumbnailUrl ?? '',
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

    const saved = await this.shorts.save(
      this.shorts.create({
        title: dto.title,
        content: dto.content,
        thumbnailUrl: dto.thumbnailUrl,
        video,
        movieSlug: dto.movieSlug,
      }),
    );

    await this.notificationBroadcast.notifyNewContent(
      `Video ngắn mới: ${saved.title}`,
      'Video ngắn mới vừa được thêm vào SoFilm.',
      { thumbnail: saved.thumbnailUrl ?? video.thumbnailUrl, link: `/shorts` },
    );

    return saved;
  }

  /** Admin listing — every short regardless of isActive, newest first. */
  async adminList(query: PaginationQueryDto): Promise<PaginatedResult<ShortAdminDto>> {
    const [items, total] = await this.shorts.findAndCount({
      relations: ['video'],
      order: { createdAt: 'DESC' },
      skip: query.skip,
      take: query.limit,
    });

    const hydrated: ShortAdminDto[] = items.map((s) => ({
      id: s.id,
      title: s.title,
      content: s.content,
      videoUrl: s.video?.hlsMasterPlaylistUrl ?? '',
      thumbnail: s.thumbnailUrl ?? s.video?.thumbnailUrl ?? '',
      movieSlug: s.movieSlug,
      likes: s.likesCount,
      comments: s.commentsCount,
      isActive: s.isActive,
      createdAt: s.createdAt,
    }));

    return paginate(hydrated, total, query.page, query.limit);
  }

  async remove(id: string): Promise<void> {
    const short = await this.shorts.findOneBy({ id });
    if (!short) throw new NotFoundException(`Short "${id}" not found`);
    await this.shorts.softRemove(short);
  }
}
