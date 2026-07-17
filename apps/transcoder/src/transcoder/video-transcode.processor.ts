import { Injectable, Logger } from '@nestjs/common';
import { Processor, WorkerHost, OnWorkerEvent, Job, QUEUE_NAMES } from '@app/queue';
import { FfmpegPipelineService } from './ffmpeg-pipeline.service';
import { VideoCallbackService } from './video-callback.service';

export interface VideoTranscodeJobData {
  videoId: string;
  originalKey: string;
}

// ffmpeg is CPU/RAM-heavy and this worker shares a single EC2 host with every
// other service in production — concurrency: 1 keeps at most one encode
// running at a time instead of fighting other jobs (or other containers) for
// the same CPU.
@Processor(QUEUE_NAMES.VIDEO_TRANSCODE, { concurrency: 1 })
@Injectable()
export class VideoTranscodeProcessor extends WorkerHost {
  private readonly logger = new Logger(VideoTranscodeProcessor.name);

  constructor(
    private readonly pipeline: FfmpegPipelineService,
    private readonly callback: VideoCallbackService,
  ) {
    super();
  }

  async process(job: Job<VideoTranscodeJobData>) {
    const { videoId, originalKey } = job.data;
    this.logger.log(`Processing video ${videoId} (${originalKey})`);
    const result = await this.pipeline.run(videoId, originalKey);
    await this.callback.reportReady(videoId, result);
    return result;
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job<VideoTranscodeJobData>, error: Error) {
    this.logger.error(`Job ${job.id} failed: ${error.message}`);
    await this.callback.reportFailed(job.data.videoId, error.message);
  }
}
