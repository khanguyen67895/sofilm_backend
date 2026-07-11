import { Module } from '@nestjs/common';
import { VideoTranscodeProcessor } from './video-transcode.processor';
import { FfmpegPipelineService } from './ffmpeg-pipeline.service';
import { VideoCallbackService } from './video-callback.service';

@Module({
  providers: [VideoTranscodeProcessor, FfmpegPipelineService, VideoCallbackService],
})
export class TranscoderModule {}
