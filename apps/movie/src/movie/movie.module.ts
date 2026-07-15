import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Movie } from '../entities/movie.entity';
import { Genre } from '../entities/genre.entity';
import { Category } from '../entities/category.entity';
import { Country } from '../entities/country.entity';
import { Tag } from '../entities/tag.entity';
import { Actor } from '../entities/actor.entity';
import { Director } from '../entities/director.entity';
import { Season } from '../entities/season.entity';
import { Episode } from '../entities/episode.entity';
import { MovieService } from './movie.service';
import { MovieController } from './movie.controller';
import { VideoResolverService } from './video-resolver.service';
import { EntitlementService } from './entitlement.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Movie,
      Genre,
      Category,
      Country,
      Tag,
      Actor,
      Director,
      Season,
      Episode,
    ]),
    HttpModule.register({ timeout: 10000 }),
  ],
  controllers: [MovieController],
  providers: [MovieService, VideoResolverService, EntitlementService],
  exports: [VideoResolverService],
})
export class MovieModule {}
