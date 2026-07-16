import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, OptionalAuth, Roles } from '@app/auth';
import { PaginationQueryDto } from '@app/common';
import { ShortsService } from './shorts.service';
import { CreateShortDto } from './dto/create-short.dto';

@ApiTags('shorts')
@Controller('shorts')
export class ShortsController {
  constructor(private readonly shortsService: ShortsService) {}

  @OptionalAuth()
  @Get('feed')
  @ApiOperation({
    summary: 'Paginated vertical-video feed, isLiked reflects the caller if authenticated',
  })
  feed(@CurrentUser('sub') userId: string | undefined, @Query() query: PaginationQueryDto) {
    return this.shortsService.feed(userId, query);
  }

  @Roles('ADMIN')
  @Get('admin/list')
  @ApiOperation({ summary: 'Paginated admin listing of all shorts (active or not)' })
  adminList(@Query() query: PaginationQueryDto) {
    return this.shortsService.adminList(query);
  }

  @Post(':id/like')
  @ApiOperation({ summary: 'Like a short (idempotent)' })
  like(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.shortsService.like(userId, id);
  }

  @Delete(':id/like')
  @ApiOperation({ summary: 'Unlike a short' })
  unlike(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.shortsService.unlike(userId, id);
  }

  @Roles('ADMIN')
  @Post()
  @ApiOperation({ summary: 'Create a short from an already-uploaded video' })
  create(@Body() dto: CreateShortDto) {
    return this.shortsService.create(dto);
  }

  @Roles('ADMIN')
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a short' })
  remove(@Param('id') id: string) {
    return this.shortsService.remove(id);
  }
}
