import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Short } from '../entities/short.entity';
import { ShortLike } from '../entities/short-like.entity';
import { Video } from '../entities/video.entity';
import { ShortsController } from './shorts.controller';
import { ShortsService } from './shorts.service';
import { NotificationBroadcastService } from './notification-broadcast.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Short, ShortLike, Video]),
    HttpModule.register({ timeout: 10000 }),
  ],
  controllers: [ShortsController],
  providers: [ShortsService, NotificationBroadcastService],
})
export class ShortsModule {}
