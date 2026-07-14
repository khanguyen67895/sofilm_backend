import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { VideoTranscodeProcessor } from './video-transcode.processor';
import { FfmpegPipelineService } from './ffmpeg-pipeline.service';
import { VideoCallbackService } from './video-callback.service';
import { S3OutputService } from './s3-output.service';

@Module({
  imports: [HttpModule.register({ timeout: 15_000 })],
  providers: [VideoTranscodeProcessor, FfmpegPipelineService, VideoCallbackService, S3OutputService],
})
export class TranscoderModule {}
