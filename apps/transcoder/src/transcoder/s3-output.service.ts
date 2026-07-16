import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CopyObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import type { Readable } from 'stream';

/**
 * There is no real ffmpeg packaging step yet (see FfmpegPipelineService's own
 * doc-comment), so this pipeline previously handed back HLS/thumbnail/subtitle
 * URLs that pointed at objects nothing had ever written to the bucket —
 * exactly the "upload succeeds, then the returned link 404s" bug this exists
 * to fix. Every URL the pipeline now returns is backed by a real PutObject or
 * CopyObject call so it actually resolves.
 */
@Injectable()
export class S3OutputService {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(private readonly config: ConfigService) {
    this.bucket = this.config.getOrThrow<string>('s3.bucket');
    this.client = new S3Client({
      region: this.config.getOrThrow<string>('s3.region'),
      credentials: {
        accessKeyId: this.config.getOrThrow<string>('s3.accessKeyId'),
        secretAccessKey: this.config.getOrThrow<string>('s3.secretAccessKey'),
      },
    });
  }

  /** Copies the already-uploaded raw file to a destination key — its bytes/content-type carry over, so it's still real, playable video. */
  async copyFromSource(sourceKey: string, destKey: string): Promise<void> {
    await this.client.send(
      new CopyObjectCommand({
        Bucket: this.bucket,
        CopySource: `${this.bucket}/${sourceKey}`,
        Key: destKey,
      }),
    );
  }

  async putObject(key: string, body: Buffer | string, contentType: string): Promise<void> {
    await this.client.send(
      new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: body, ContentType: contentType }),
    );
  }

  /** Downloads an S3 object to a local path — ffmpeg needs a real file (or a
   * URL it can stream), not a bare S3 key, to read frames from. */
  async downloadToFile(sourceKey: string, localPath: string): Promise<void> {
    const { Body } = await this.client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: sourceKey }),
    );
    if (!Body) throw new Error(`Empty response body for S3 object "${sourceKey}"`);
    await pipeline(Body as Readable, createWriteStream(localPath));
  }
}
