import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '@app/auth';
import { PaginationQueryDto } from '@app/common';
import { LikeService } from './like.service';
import { CreateLikeDto } from './dto/create-like.dto';

@ApiTags('likes')
@ApiBearerAuth()
@Controller('history/likes')
export class LikeController {
  constructor(private readonly likeService: LikeService) {}

  @Post()
  @ApiOperation({ summary: 'Like a movie (idempotent)' })
  like(@CurrentUser('sub') userId: string, @Body() dto: CreateLikeDto) {
    return this.likeService.like(userId, dto.movieId);
  }

  @Delete(':movieId')
  @ApiOperation({ summary: 'Unlike a movie' })
  unlike(@CurrentUser('sub') userId: string, @Param('movieId') movieId: string) {
    return this.likeService.unlike(userId, movieId);
  }

  @Get()
  @ApiOperation({ summary: 'Paginated, hydrated list of liked movies, most recent first' })
  list(@CurrentUser('sub') userId: string, @Query() query: PaginationQueryDto) {
    return this.likeService.list(userId, query);
  }
}
