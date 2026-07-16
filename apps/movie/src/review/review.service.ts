import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginatedResult, PaginationQueryDto, paginate } from '@app/common';
import { Review } from '../entities/review.entity';
import { Movie } from '../entities/movie.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { UserHydrationService, type HydratedUser } from './user-hydration.service';

export interface ReviewSummary {
  average: number;
  /** Count of rows that carry a rating. */
  total: number;
  /** Count of rows that carry comment text — distinct from `total` since a row
   * can be a rating with no comment, or a comment with no rating. */
  commentsCount: number;
  breakdown: Record<'1' | '2' | '3' | '4' | '5', number>;
}

export interface HydratedReview {
  id: string;
  rating?: number;
  comment?: string;
  createdAt: Date;
  likesCount: number;
  likedByMe: boolean;
  user: HydratedUser;
}

const EMPTY_BREAKDOWN: ReviewSummary['breakdown'] = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };

@Injectable()
export class ReviewService {
  constructor(
    @InjectRepository(Review) private readonly reviews: Repository<Review>,
    @InjectRepository(Movie) private readonly movies: Repository<Movie>,
    private readonly userHydration: UserHydrationService,
  ) {}

  /** Upserts the current user's rating and/or comment for this movie — either may be
   * omitted, but not both. Resyncs the movie's cached average rating whenever the
   * rating changes; reviews are the source of truth for Movie.rating. */
  async submitReview(movieId: string, userId: string, dto: CreateReviewDto): Promise<Review> {
    if (dto.rating === undefined && !dto.comment?.trim()) {
      throw new BadRequestException('rating or comment is required');
    }

    const movie = await this.movies.findOneByOrFail({ id: movieId });
    let review = await this.reviews.findOne({ where: { movie: { id: movieId }, userId } });

    if (review) {
      if (dto.rating !== undefined) review.rating = dto.rating;
      if (dto.comment !== undefined) review.comment = dto.comment;
    } else {
      review = this.reviews.create({
        movie,
        userId,
        rating: dto.rating,
        comment: dto.comment,
        likedByUserIds: [],
      });
    }

    const saved = await this.reviews.save(review);
    if (dto.rating !== undefined) await this.syncMovieRating(movieId);
    return saved;
  }

  async getSummary(movieId: string): Promise<ReviewSummary> {
    const rows = await this.reviews.find({ where: { movie: { id: movieId } } });
    const rated = rows.filter((r): r is Review & { rating: number } => r.rating != null);
    const commentsCount = rows.filter((r) => r.comment && r.comment.trim().length > 0).length;

    const total = rated.length;
    if (!total) return { average: 0, total: 0, commentsCount, breakdown: EMPTY_BREAKDOWN };

    const breakdown = { ...EMPTY_BREAKDOWN };
    let sum = 0;
    for (const row of rated) {
      sum += row.rating;
      const bucket = String(
        Math.min(5, Math.max(1, Math.round(row.rating))),
      ) as keyof typeof breakdown;
      breakdown[bucket] += 1;
    }
    for (const key of Object.keys(breakdown) as Array<keyof typeof breakdown>) {
      breakdown[key] = Math.round((breakdown[key] / total) * 100);
    }

    return { average: Math.round((sum / total) * 10) / 10, total, commentsCount, breakdown };
  }

  async list(
    movieId: string,
    currentUserId: string | null,
    query: PaginationQueryDto,
  ): Promise<PaginatedResult<HydratedReview>> {
    const [items, total] = await this.reviews.findAndCount({
      where: { movie: { id: movieId } },
      order: { createdAt: 'DESC' },
      skip: query.skip,
      take: query.limit,
    });

    const users = await this.userHydration.resolveMany(items.map((r) => r.userId));

    const hydrated: HydratedReview[] = items.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
      likesCount: r.likedByUserIds?.length ?? 0,
      likedByMe: currentUserId ? (r.likedByUserIds ?? []).includes(currentUserId) : false,
      user: users.get(r.userId) ?? { userId: r.userId, displayName: 'Người dùng ẩn danh' },
    }));

    return paginate(hydrated, total, query.page, query.limit);
  }

  async toggleLike(
    reviewId: string,
    userId: string,
  ): Promise<{ likesCount: number; likedByMe: boolean }> {
    const review = await this.reviews.findOne({ where: { id: reviewId } });
    if (!review) throw new NotFoundException(`Review "${reviewId}" not found`);

    const likedByUserIds = review.likedByUserIds ?? [];
    const alreadyLiked = likedByUserIds.includes(userId);
    review.likedByUserIds = alreadyLiked
      ? likedByUserIds.filter((id) => id !== userId)
      : [...likedByUserIds, userId];

    await this.reviews.save(review);
    return { likesCount: review.likedByUserIds.length, likedByMe: !alreadyLiked };
  }

  private async syncMovieRating(movieId: string): Promise<void> {
    const { average } = await this.getSummary(movieId);
    await this.movies.update({ id: movieId }, { rating: average });
  }
}
