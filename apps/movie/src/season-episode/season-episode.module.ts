import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Movie } from '../entities/movie.entity';
import { Season } from '../entities/season.entity';
import { Episode } from '../entities/episode.entity';
import { EpisodeController } from './season-episode.controller';
import { EpisodeService } from './season-episode.service';

@Module({
  imports: [TypeOrmModule.forFeature([Movie, Season, Episode])],
  controllers: [EpisodeController],
  providers: [EpisodeService],
})
export class SeasonEpisodeModule {}
