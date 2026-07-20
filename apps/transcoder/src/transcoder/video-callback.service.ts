import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { TranscodeResult } from './ffmpeg-pipeline.service';

/** video-service persists `quality` as the `VideoQualityLevel` enum
 * (`Q480P`/`Q720P`/`Q1080P`/`Q4K`), not the plain labels the pipeline uses
 * internally for S3 folder naming (`480p`/`720p`/...) — translate at this
 * HTTP boundary, or every callback fails class-validator's `@IsEnum` check
 * and the video never leaves QUEUED. */
const QUALITY_ENUM_MAP: Record<string, string> = {
  '480p': 'Q480P',
  '720p': 'Q720P',
  '1080p': 'Q1080P',
  '4K': 'Q4K',
};

@Injectable()
export class VideoCallbackService {
  private readonly logger = new Logger(VideoCallbackService.name);
  private readonly videoServiceUrl: string;

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {
    this.videoServiceUrl = this.config.get<string>('VIDEO_SERVICE_URL') ?? 'http://localhost:3004';
  }

  async reportReady(videoId: string, result: TranscodeResult): Promise<void> {
    try {
      await firstValueFrom(
        this.http.patch(`${this.videoServiceUrl}/videos/${videoId}/status`, {
          status: 'READY',
          ...result,
          qualities: result.qualities.map((q) => ({
            ...q,
            quality: QUALITY_ENUM_MAP[q.quality] ?? q.quality,
          })),
        }),
      );
      this.logger.log(`Reported video ${videoId} as READY`);
    } catch (error) {
      this.logger.error(
        `Failed to report READY status for video ${videoId}: ${(error as Error).message}`,
      );
    }
  }

  async reportFailed(videoId: string, reason: string): Promise<void> {
    try {
      await firstValueFrom(
        this.http.patch(`${this.videoServiceUrl}/videos/${videoId}/status`, {
          status: 'FAILED',
          failureReason: reason,
        }),
      );
      this.logger.log(`Reported video ${videoId} as FAILED`);
    } catch (error) {
      this.logger.error(
        `Failed to report FAILED status for video ${videoId}: ${(error as Error).message}`,
      );
    }
  }
}
