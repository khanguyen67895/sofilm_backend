import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'fs';
import { extname } from 'path';
import ffmpeg from 'fluent-ffmpeg';
import { S3OutputService } from './s3-output.service';

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

// 1x1 black pixel JPEG — stand-in for a real thumbnail when ffmpeg can't produce one.
const PLACEHOLDER_THUMBNAIL_JPEG_BASE64 =
  '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACP/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AVN//2Q==';
const PLACEHOLDER_SUBTITLE_VTT = 'WEBVTT\n';

/**
 * Scaffold pipeline that simulates the transcoding workflow end-to-end with
 * clear log lines and short delays standing in for real ffmpeg work. This is
 * NOT a real transcoder — there is no guarantee an ffmpeg binary or the real
 * source media is available in this environment. To avoid handing back links
 * that 404 (nothing was ever written to those keys), every URL returned here
 * is backed by a real S3 object: the master playlist and quality variants are
 * the raw uploaded file copied to those keys (still real, playable video,
 * just not actually repackaged into HLS), and the thumbnail/subtitle are
 * either a real ffmpeg-generated file or an explicit placeholder object.
 */
@Injectable()
export class FfmpegPipelineService {
  private readonly logger = new Logger(FfmpegPipelineService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly s3: S3OutputService,
  ) {}

  async run(videoId: string, originalKey: string): Promise<TranscodeResult> {
    const cdnBaseUrl =
      this.config.get<string>('s3.cdnBaseUrl') ?? 'http://localhost:9000/sofilm-media';

    this.logger.log(`downloading ${originalKey} from S3`);
    await this.delay(300);

    const thumbnailUrl = await this.generateThumbnail(videoId, originalKey, cdnBaseUrl);

    this.logger.log('generating HLS variants: 480p, 720p, 1080p, 4K');
    await this.delay(500);
    const qualities: HlsQualityVariant[] = [];
    for (const quality of ['480p', '720p', '1080p', '4K']) {
      const key = `hls/${videoId}/${quality}/index.m3u8`;
      // Not caught: if this fails, the job should fail and be reported as
      // FAILED rather than silently claiming READY with a dead link.
      await this.s3.copyFromSource(originalKey, key);
      qualities.push({
        quality,
        hlsPlaylistUrl: `${cdnBaseUrl}/${key}`,
        bitrateKbps: QUALITY_BITRATES_KBPS[quality],
      });
    }

    this.logger.log('generating subtitle track (placeholder)');
    await this.delay(150);
    const subtitleKey = `subs/${videoId}/en.vtt`;
    await this.s3.putObject(subtitleKey, PLACEHOLDER_SUBTITLE_VTT, 'text/vtt');
    const subtitles: SubtitleTrack[] = [
      {
        language: 'en',
        url: `${cdnBaseUrl}/${subtitleKey}`,
        isDefault: true,
      },
    ];

    this.logger.log('uploading outputs to S3 / CDN ready');
    await this.delay(200);

    const masterKey = `hls/${videoId}/master.m3u8`;
    await this.s3.copyFromSource(originalKey, masterKey);

    return {
      thumbnailUrl,
      hlsMasterPlaylistUrl: `${cdnBaseUrl}/${masterKey}`,
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
    const key = `thumbnails/${videoId}.jpg`;
    const localThumbPath = `/tmp/${videoId}.jpg`;
    const localSourcePath = `/tmp/${videoId}-source${extname(originalKey) || '.mp4'}`;

    // fluent-ffmpeg needs a real, locally-readable input file — `originalKey`
    // is an S3 key, not a path, so it must be downloaded first. Still requires
    // an ffmpeg binary on PATH; any failure (missing binary, corrupt upload,
    // etc.) falls back to a placeholder object instead of failing the job.
    try {
      await this.s3.downloadToFile(originalKey, localSourcePath);
      await new Promise<void>((resolve, reject) => {
        ffmpeg(localSourcePath)
          .on('end', () => resolve())
          .on('error', (err) => reject(err))
          .screenshots({
            count: 1,
            filename: `${videoId}.jpg`,
            folder: '/tmp',
            timestamps: ['10%'],
          });
      });
      const generated = await fs.readFile(localThumbPath);
      await this.s3.putObject(key, generated, 'image/jpeg');
    } catch (error) {
      this.logger.warn(
        `ffmpeg thumbnail generation unavailable, uploading placeholder instead (${(error as Error).message})`,
      );
      await this.s3.putObject(
        key,
        Buffer.from(PLACEHOLDER_THUMBNAIL_JPEG_BASE64, 'base64'),
        'image/jpeg',
      );
    } finally {
      await fs.unlink(localThumbPath).catch(() => undefined);
      await fs.unlink(localSourcePath).catch(() => undefined);
    }

    await this.delay(200);
    return `${cdnBaseUrl}/${key}`;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
