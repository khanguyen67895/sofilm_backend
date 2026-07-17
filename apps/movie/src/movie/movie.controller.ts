import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { OptionalAuth, Public, Roles } from '@app/auth';
import { PaginationQueryDto } from '@app/common';
import { MovieService } from './movie.service';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { BatchMoviesDto, MovieQueryDto } from './dto/movie-query.dto';

@ApiTags('movies')
@Controller('movies')
export class MovieController {
  constructor(private readonly movieService: MovieService) {}

  @Roles('ADMIN')
  @Post()
  @ApiOperation({ summary: 'Create a movie/series' })
  create(@Body() dto: CreateMovieDto) {
    return this.movieService.create(dto);
  }

  @Public()
  @Post('batch')
  @ApiOperation({ summary: 'Hydrate a list of movie ids (used by history/recommendation)' })
  batch(@Body() dto: BatchMoviesDto) {
    return this.movieService.batchByIds(dto.ids);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Paginated public movie listing, optionally filtered by genre slug' })
  list(@Query() query: MovieQueryDto) {
    return this.movieService.list(query);
  }

  @Roles('ADMIN')
  @Get('admin/list')
  @ApiOperation({ summary: 'Paginated admin listing of all movies/series' })
  adminList(@Query() query: PaginationQueryDto) {
    return this.movieService.adminList(query);
  }

  @Roles('ADMIN')
  @Get('by-id/:id')
  @ApiOperation({ summary: 'Movie/series detail by id (for the admin edit form)' })
  findById(@Param('id') id: string) {
    return this.movieService.findById(id);
  }

  @Roles('ADMIN')
  @Patch(':id')
  @ApiOperation({ summary: 'Update a movie/series' })
  update(@Param('id') id: string, @Body() dto: UpdateMovieDto) {
    return this.movieService.update(id, dto);
  }

  @Roles('ADMIN')
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a movie/series' })
  remove(@Param('id') id: string) {
    return this.movieService.remove(id);
  }

  @Public()
  @Get('trending')
  @ApiOperation({ summary: 'Trending movies (Redis-cached)' })
  trending(@Query('limit') limit?: number) {
    return this.movieService.trending(limit ? Number(limit) : undefined);
  }

  @Public()
  @Get('latest')
  @ApiOperation({ summary: 'Latest additions' })
  latest(@Query('limit') limit?: number) {
    return this.movieService.latest(limit ? Number(limit) : undefined);
  }

  @Public()
  @Get('top-view')
  @ApiOperation({ summary: 'All-time most-viewed' })
  topView(@Query('limit') limit?: number) {
    return this.movieService.topView(limit ? Number(limit) : undefined);
  }

  @Public()
  @Get('top-rated')
  @ApiOperation({ summary: 'Highest-rated (by average review score)' })
  topRated(@Query('limit') limit?: number) {
    return this.movieService.topRated(limit ? Number(limit) : undefined);
  }

  @Public()
  @Get('search')
  @ApiOperation({ summary: 'Simple title search (see search-service for full-text/ES search)' })
  search(@Query('q') q: string, @Query() query: PaginationQueryDto) {
    return this.movieService.search(q ?? '', query);
  }

  @Public()
  @Get('category/:categorySlug')
  @ApiOperation({ summary: 'Movies within a category, paginated' })
  byCategory(@Param('categorySlug') categorySlug: string, @Query() query: PaginationQueryDto) {
    return this.movieService.byCategory(categorySlug, query);
  }

  @OptionalAuth()
  @Get(':slug')
  @ApiOperation({ summary: 'Full movie/series detail (seasons + episodes + cast)' })
  findBySlug(@Param('slug') slug: string, @Req() req: Request) {
    return this.movieService.findBySlug(slug, req.headers.authorization);
  }

  @Public()
  @Get(':slug/recommend')
  @ApiOperation({ summary: 'Same-genre recommendations for this title' })
  recommend(@Param('slug') slug: string, @Query('limit') limit?: number) {
    return this.movieService.recommend(slug, limit ? Number(limit) : undefined);
  }

  @Public()
  @Post(':slug/views')
  @ApiOperation({
    summary: 'Increment view/trending counters (called when a watch session starts)',
  })
  incrementViews(@Param('slug') slug: string) {
    return this.movieService.incrementViews(slug);
  }
}
