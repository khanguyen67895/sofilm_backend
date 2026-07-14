import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PutBucketCorsCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const UPLOAD_URL_EXPIRES_SECONDS = 900;

@Injectable()
export class S3Service implements OnModuleInit {
  private readonly logger = new Logger(S3Service.name);
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly cdnBaseUrl: string;

  constructor(private readonly config: ConfigService) {
    this.bucket = this.config.getOrThrow<string>('s3.bucket');
    this.cdnBaseUrl = this.config.getOrThrow<string>('s3.cdnBaseUrl');
    this.client = new S3Client({
      region: this.config.getOrThrow<string>('s3.region'),
      credentials: {
        accessKeyId: this.config.getOrThrow<string>('s3.accessKeyId'),
        secretAccessKey: this.config.getOrThrow<string>('s3.secretAccessKey'),
      },
    });
  }

  /**
   * getPublicUrl() below hands back a plain, unsigned URL, so the bucket
   * itself must allow anonymous reads — that's expected to already be set
   * up on the bucket (managed out-of-band, e.g. via a bucket policy set by
   * whoever provisions the bucket / scoped IAM user). CORS is the one
   * piece of bucket config every environment needs identically (browsers
   * uploading directly via a presigned PUT), so it's still set here on
   * startup; best-effort, since a locked-down IAM user may not have
   * s3:PutBucketCors and that shouldn't block service startup.
   */
  async onModuleInit(): Promise<void> {
    try {
      await this.client.send(
        new PutBucketCorsCommand({
          Bucket: this.bucket,
          CORSConfiguration: {
            CORSRules: [
              {
                AllowedMethods: ['GET', 'HEAD', 'PUT'],
                AllowedOrigins: ['*'],
                AllowedHeaders: ['*'],
                MaxAgeSeconds: 3600,
              },
            ],
          },
        }),
      );
    } catch (error) {
      this.logger.warn(
        `Could not set CORS on bucket "${this.bucket}": ${(error as Error).message}`,
      );
    }
  }

  /** Presigned PUT URL the client uploads the raw file to directly. */
  async getUploadUrl(key: string, contentType: string): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });
    return getSignedUrl(this.client, command, { expiresIn: UPLOAD_URL_EXPIRES_SECONDS });
  }

  getPublicUrl(key: string): string {
    return `${this.cdnBaseUrl}/${key}`;
  }
}
