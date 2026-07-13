import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Short } from '../entities/short.entity';
import { ShortLike } from '../entities/short-like.entity';
import { Video } from '../entities/video.entity';
import { ShortsController } from './shorts.controller';
import { ShortsService } from './shorts.service';

@Module({
  imports: [TypeOrmModule.forFeature([Short, ShortLike, Video])],
  controllers: [ShortsController],
  providers: [ShortsService],
})
export class ShortsModule {}
