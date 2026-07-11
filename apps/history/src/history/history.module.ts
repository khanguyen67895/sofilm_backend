import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WatchProgress } from '../entities/watch-progress.entity';
import { Like } from '../entities/like.entity';
import { HistoryController } from './history.controller';
import { HistoryService } from './history.service';
import { LikeController } from './like.controller';
import { LikeService } from './like.service';
import { MovieHydrationService } from './movie-hydration.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([WatchProgress, Like]),
    HttpModule.register({ timeout: 10000 }),
  ],
  controllers: [HistoryController, LikeController],
  providers: [HistoryService, LikeService, MovieHydrationService],
})
export class HistoryModule {}
