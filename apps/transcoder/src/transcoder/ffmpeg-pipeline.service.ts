import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import ffmpeg from 'fluent-ffmpeg';

export interface HlsQualityVariant {
  quality: string;
  hlsPlaylistUrl: string;
  bitrateKbps: number;
}

export interface SubtitleTrack {
  language: string;
  url: string;
  isDefault: boolean;
}

export interface TranscodeResult {
  thumbnailUrl: string;
  hlsMasterPlaylistUrl: string;
  duration: number;
  qualities: HlsQualityVariant[];
  subtitles: SubtitleTrack[];
}

const QUALITY_BITRATES_KBPS: Record<string, number> = {
  '480p': 1200,
  '720p': 2800,
  '1080p': 5000,
  '4K': 16000,
};

/**
 * Scaffold pipeline that simulates the transcoding workflow end-to-end with
 * clear log lines and short delays standing in for real ffmpeg work. This is
 * NOT a real transcoder — there is no guarantee an ffmpeg binary or the real
 * source media is available in this environment.
 */
@Injectable()
export class FfmpegPipelineService {
  private readonly logger = new Logger(FfmpegPipelineService.name);

  constructor(private readonly config: ConfigService) {}

  async run(videoId: string, originalKey: string): Promise<TranscodeResult> {
    const cdnBaseUrl =
      this.config.get<string>('s3.cdnBaseUrl') ?? 'http://localhost:9000/sofilm-media';

    this.logger.log(`downloading ${originalKey} from S3`);
    await this.delay(300);

    const thumbnailUrl = await this.generateThumbnail(videoId, originalKey, cdnBaseUrl);

    this.logger.log('generating HLS variants: 480p, 720p, 1080p, 4K');
    await this.delay(500);
    const qualities: HlsQualityVariant[] = ['480p', '720p', '1080p', '4K'].map((quality) => ({
      quality,
      hlsPlaylistUrl: `${cdnBaseUrl}/hls/${videoId}/${quality}/index.m3u8`,
      bitrateKbps: QUALITY_BITRATES_KBPS[quality],
    }));

    this.logger.log('generating subtitle track (placeholder)');
    await this.delay(150);
    const subtitles: SubtitleTrack[] = [
      {
        language: 'en',
        url: `${cdnBaseUrl}/subs/${videoId}/en.vtt`,
        isDefault: true,
      },
    ];

    this.logger.log('uploading outputs to S3 / CDN ready');
    await this.delay(200);

    return {
      thumbnailUrl,
      hlsMasterPlaylistUrl: `${cdnBaseUrl}/hls/${videoId}/master.m3u8`,
      duration: 0,
      qualities,
      subtitles,
    };
  }

  private async generateThumbnail(
    videoId: string,
    originalKey: string,
    cdnBaseUrl: string,
  ): Promise<string> {
    this.logger.log('generating thumbnail');
    const stubUrl = `${cdnBaseUrl}/thumbnails/${videoId}.jpg`;

    // Real fluent-ffmpeg usage requires an ffmpeg binary on PATH and a real,
    // locally-accessible input file — neither is guaranteed in this scaffold
    // environment, so any failure here falls back to the stub URL above
    // instead of failing the whole job.
    try {
      await new Promise<void>((resolve, reject) => {
        ffmpeg(originalKey)
          .on('end', () => resolve())
          .on('error', (err) => reject(err))
          .screenshots({
            count: 1,
            filename: `${videoId}.jpg`,
            folder: '/tmp',
            timestamps: ['1'],
          });
      });
    } catch (error) {
      this.logger.warn(
        `ffmpeg thumbnail generation unavailable, falling back to stub (${(error as Error).message})`,
      );
    }

    await this.delay(200);
    return stubUrl;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
