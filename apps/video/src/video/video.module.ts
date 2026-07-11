import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QueueModule, QUEUE_NAMES } from '@app/queue';
import { Video } from '../entities/video.entity';
import { VideoQuality } from '../entities/video-quality.entity';
import { Subtitle } from '../entities/subtitle.entity';
import { AudioTrack } from '../entities/audio-track.entity';
import { VideoService } from './video.service';
import { VideoController } from './video.controller';
import { S3Service } from './s3.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Video, VideoQuality, Subtitle, AudioTrack]),
    QueueModule.registerQueues(QUEUE_NAMES.VIDEO_TRANSCODE),
  ],
  controllers: [VideoController],
  providers: [VideoService, S3Service],
})
export class VideoModule {}
