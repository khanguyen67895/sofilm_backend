import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'fs';
import { tmpdir } from 'os';
import { basename, extname, join } from 'path';
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

interface QualitySpec {
  quality: string;
  height: number;
  bitrateKbps: number;
}

// Ordered smallest-to-largest — `run()` drops any rung taller than the
// source so a 480p upload never gets upscaled into a fake "4K" rendition.
const QUALITY_LADDER: QualitySpec[] = [
  { quality: '480p', height: 480, bitrateKbps: 1200 },
  { quality: '720p', height: 720, bitrateKbps: 2800 },
  { quality: '1080p', height: 1080, bitrateKbps: 5000 },
  { quality: '4K', height: 2160, bitrateKbps: 16000 },
];

// 1x1 black pixel JPEG — stand-in for a real thumbnail when ffmpeg can't produce one.
const PLACEHOLDER_THUMBNAIL_JPEG_BASE64 =
  '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACP/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AVN//2Q==';
// Real subtitle generation needs speech-to-text — out of scope here, every
// video gets this placeholder English track instead (see CLAUDE.md stubs).
const PLACEHOLDER_SUBTITLE_VTT = 'WEBVTT\n';

/**
 * Real ffmpeg pipeline: downloads the source once, probes it, encodes an HLS
 * rendition (H.264/AAC) per quality rung up to the source's own resolution,
 * writes a real master playlist, and uploads everything to S3. A quality
 * failing to encode fails the whole job (reported FAILED) rather than
 * quietly handing back a dead or fake link.
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
    const jobDir = join(tmpdir(), `transcode-${videoId}`);
    await fs.mkdir(jobDir, { recursive: true });
    const sourcePath = join(jobDir, `source${extname(originalKey) || '.mp4'}`);

    try {
      this.logger.log(`downloading ${originalKey} from S3`);
      await this.s3.downloadToFile(originalKey, sourcePath);

      const probe = await this.probe(sourcePath);
      const duration = probe?.duration ?? 0;

      const thumbnailUrl = await this.generateThumbnail(videoId, sourcePath, jobDir, cdnBaseUrl);

      const ladder = probe?.height
        ? QUALITY_LADDER.filter((spec) => spec.height <= probe.height!)
        : QUALITY_LADDER;
      if (!ladder.length) ladder.push(QUALITY_LADDER[0]);

      const qualities: HlsQualityVariant[] = [];
      for (const spec of ladder) {
        this.logger.log(`encoding ${spec.quality} (${spec.bitrateKbps}kbps)`);
        const outDir = join(jobDir, spec.quality);
        await fs.mkdir(outDir, { recursive: true });
        // Not caught: if this fails, the job should fail and be reported as
        // FAILED rather than silently claiming READY with a dead link.
        await this.encodeHlsVariant(sourcePath, outDir, spec);

        const destPrefix = `hls/${videoId}/${spec.quality}`;
        await this.s3.uploadDirectory(outDir, destPrefix);
        qualities.push({
          quality: spec.quality,
          hlsPlaylistUrl: `${cdnBaseUrl}/${destPrefix}/index.m3u8`,
          bitrateKbps: spec.bitrateKbps,
        });
      }

      this.logger.log('generating subtitle track (placeholder)');
      const subtitleKey = `subs/${videoId}/en.vtt`;
      await this.s3.putObject(subtitleKey, PLACEHOLDER_SUBTITLE_VTT, 'text/vtt');
      const subtitles: SubtitleTrack[] = [
        { language: 'en', url: `${cdnBaseUrl}/${subtitleKey}`, isDefault: true },
      ];

      this.logger.log('uploading master playlist');
      const masterKey = `hls/${videoId}/master.m3u8`;
      await this.s3.putObject(
        masterKey,
        this.buildMasterPlaylist(qualities),
        'application/vnd.apple.mpegurl',
      );

      return {
        thumbnailUrl,
        hlsMasterPlaylistUrl: `${cdnBaseUrl}/${masterKey}`,
        duration,
        qualities,
        subtitles,
      };
    } finally {
      await fs.rm(jobDir, { recursive: true, force: true }).catch(() => undefined);
    }
  }

  private probe(sourcePath: string): Promise<{ duration: number; height?: number } | undefined> {
    return new Promise((resolve) => {
      ffmpeg.ffprobe(sourcePath, (err, data) => {
        if (err) {
          this.logger.warn(`ffprobe failed, encoding the full quality ladder: ${err.message}`);
          resolve(undefined);
          return;
        }
        const videoStream = data.streams.find((s) => s.codec_type === 'video');
        resolve({
          duration: Math.round(data.format.duration ?? 0),
          height: videoStream?.height,
        });
      });
    });
  }

  /** Encodes one HLS rendition. ffmpeg's hls muxer can bake the segment
   * filename pattern's directory into the playlist's segment URIs — since
   * we upload the playlist and its segments as flat siblings under the same
   * S3 prefix, `normalizePlaylistToRelative` strips that back down to bare
   * filenames afterward so the playlist stays portable regardless of where
   * ffmpeg wrote it locally. */
  private encodeHlsVariant(sourcePath: string, outDir: string, spec: QualitySpec): Promise<void> {
    const playlistPath = join(outDir, 'index.m3u8');
    return new Promise<void>((resolve, reject) => {
      ffmpeg(sourcePath)
        .videoCodec('libx264')
        .audioCodec('aac')
        .videoBitrate(spec.bitrateKbps)
        .videoFilters(`scale=-2:${spec.height}`)
        .outputOptions([
          '-hls_time 6',
          '-hls_playlist_type vod',
          `-hls_segment_filename ${join(outDir, 'seg_%03d.ts')}`,
        ])
        .output(playlistPath)
        .on('end', () => resolve())
        .on('error', (err) => reject(err))
        .run();
    }).then(() => this.normalizePlaylistToRelative(playlistPath));
  }

  private async normalizePlaylistToRelative(playlistPath: string): Promise<void> {
    const content = await fs.readFile(playlistPath, 'utf8');
    const normalized = content
      .split('\n')
      .map((line) => (line && !line.startsWith('#') ? basename(line) : line))
      .join('\n');
    await fs.writeFile(playlistPath, normalized);
  }

  private buildMasterPlaylist(qualities: HlsQualityVariant[]): string {
    const heightByQuality = new Map(QUALITY_LADDER.map((spec) => [spec.quality, spec.height]));
    const lines = ['#EXTM3U', '#EXT-X-VERSION:3'];
    for (const q of qualities) {
      const height = heightByQuality.get(q.quality) ?? 0;
      const width = Math.round((height * 16) / 9);
      lines.push(
        `#EXT-X-STREAM-INF:BANDWIDTH=${q.bitrateKbps * 1000},RESOLUTION=${width}x${height}`,
        `${q.quality}/index.m3u8`,
      );
    }
    return lines.join('\n') + '\n';
  }

  private async generateThumbnail(
    videoId: string,
    sourcePath: string,
    jobDir: string,
    cdnBaseUrl: string,
  ): Promise<string> {
    this.logger.log('generating thumbnail');
    const key = `thumbnails/${videoId}.jpg`;
    const localThumbPath = join(jobDir, `${videoId}.jpg`);

    try {
      await new Promise<void>((resolve, reject) => {
        ffmpeg(sourcePath)
          .on('end', () => resolve())
          .on('error', (err) => reject(err))
          .screenshots({
            count: 1,
            filename: `${videoId}.jpg`,
            folder: jobDir,
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
    }

    return `${cdnBaseUrl}/${key}`;
  }
}
