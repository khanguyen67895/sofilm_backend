import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, OptionalAuth, Public } from '@app/auth';
import { PaginationQueryDto } from '@app/common';
import { ReviewService } from './review.service';
import { CreateReviewDto } from './dto/create-review.dto';

@ApiTags('reviews')
@Controller('movies/:movieId/reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Public()
  @Get('summary')
  @ApiOperation({ summary: 'Average rating, total count, and per-star breakdown for a movie' })
  summary(@Param('movieId') movieId: string) {
    return this.reviewService.getSummary(movieId);
  }

  @OptionalAuth()
  @Get()
  @ApiOperation({ summary: 'Paginated reviews/comments for a movie, most recent first' })
  list(
    @Param('movieId') movieId: string,
    @CurrentUser('sub') userId: string | undefined,
    @Query() query: PaginationQueryDto,
  ) {
    return this.reviewService.list(movieId, userId ?? null, query);
  }

  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: "Create or update the current user's rating/review for this movie" })
  submit(
    @Param('movieId') movieId: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewService.submitReview(movieId, userId, dto);
  }

  @ApiBearerAuth()
  @Post(':reviewId/like')
  @ApiOperation({ summary: 'Toggle a like on a review' })
  toggleLike(@Param('reviewId') reviewId: string, @CurrentUser('sub') userId: string) {
    return this.reviewService.toggleLike(reviewId, userId);
  }
}
