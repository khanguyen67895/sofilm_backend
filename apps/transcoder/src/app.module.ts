import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@app/config';
import { LoggerModule } from '@app/logger';
import { QueueModule, QUEUE_NAMES } from '@app/queue';
import { TranscoderModule } from './transcoder/transcoder.module';

@Module({
  imports: [
    ConfigModule,
    LoggerModule,
    QueueModule.forRoot(),
    QueueModule.registerQueues(QUEUE_NAMES.VIDEO_TRANSCODE),
    HttpModule.register({ timeout: 15_000 }),
    TranscoderModule,
  ],
})
export class AppModule {}
