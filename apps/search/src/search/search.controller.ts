import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public, Roles } from '@app/auth';
import { SearchService } from './search.service';
import { SearchQueryDto } from './dto/search-query.dto';
import { IndexMovieDto } from './dto/index-movie.dto';

@ApiTags('search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Full-text search across movies/actors/genres/tags/directors' })
  search(@Query() query: SearchQueryDto) {
    return this.searchService.search(query);
  }

  // TODO: replace this manual endpoint with movie-service publishing a "movie.upserted" event once an event bus exists
  @Roles('ADMIN')
  @Post('index')
  @ApiOperation({ summary: 'Index (or re-index) a single movie document' })
  index(@Body() dto: IndexMovieDto) {
    return this.searchService.indexMovie(dto);
  }

  @Roles('ADMIN')
  @Delete('index/:id')
  @ApiOperation({ summary: 'Remove a movie document from the index' })
  remove(@Param('id') id: string) {
    return this.searchService.deleteMovie(id);
  }
}
