import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { VideoTranscodeProcessor } from './video-transcode.processor';
import { FfmpegPipelineService } from './ffmpeg-pipeline.service';
import { VideoCallbackService } from './video-callback.service';

@Module({
  imports: [HttpModule.register({ timeout: 15_000 })],
  providers: [VideoTranscodeProcessor, FfmpegPipelineService, VideoCallbackService],
})
export class TranscoderModule {}
