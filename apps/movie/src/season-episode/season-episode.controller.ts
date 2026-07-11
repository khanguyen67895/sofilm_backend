import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public, Roles } from '@app/auth';
import { EpisodeService } from './season-episode.service';
import { CreateEpisodeDto } from './dto/create-episode.dto';
import { UpdateEpisodeDto } from './dto/update-episode.dto';

@ApiTags('episodes')
@Controller('movies/:movieId/episodes')
export class EpisodeController {
  constructor(private readonly episodeService: EpisodeService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List episodes for a movie/series, ordered by episode number' })
  findAll(@Param('movieId') movieId: string) {
    return this.episodeService.findAllForMovie(movieId);
  }

  @Roles('ADMIN')
  @Post()
  @ApiOperation({ summary: 'Add an episode to a series (auto-creates the default season)' })
  create(@Param('movieId') movieId: string, @Body() dto: CreateEpisodeDto) {
    return this.episodeService.create(movieId, dto);
  }

  @Roles('ADMIN')
  @Patch(':episodeId')
  @ApiOperation({ summary: 'Update an episode' })
  update(
    @Param('movieId') movieId: string,
    @Param('episodeId') episodeId: string,
    @Body() dto: UpdateEpisodeDto,
  ) {
    return this.episodeService.update(movieId, episodeId, dto);
  }

  @Roles('ADMIN')
  @Delete(':episodeId')
  @ApiOperation({ summary: 'Remove an episode' })
  remove(@Param('movieId') movieId: string, @Param('episodeId') episodeId: string) {
    return this.episodeService.remove(movieId, episodeId);
  }
}
