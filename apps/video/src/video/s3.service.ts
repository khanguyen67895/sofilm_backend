import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CreateBucketCommand,
  HeadBucketCommand,
  PutBucketCorsCommand,
  PutBucketPolicyCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
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
      endpoint: this.config.getOrThrow<string>('s3.endpoint'),
      region: this.config.getOrThrow<string>('s3.region'),
      forcePathStyle: this.config.get<boolean>('s3.forcePathStyle') ?? true,
      credentials: {
        accessKeyId: this.config.getOrThrow<string>('s3.accessKeyId'),
        secretAccessKey: this.config.getOrThrow<string>('s3.secretAccessKey'),
      },
    });
  }

  /**
   * getPublicUrl() below hands back a plain, unsigned URL, so the bucket
   * itself must allow anonymous reads. That used to be a manual step (create
   * the bucket + "mc anonymous set download" in the MinIO console) that was
   * easy to forget — forgetting it is exactly why an upload can succeed
   * (presigned PUT bypasses bucket policy) while the returned link 403s on
   * GET. Provision it automatically instead so a fresh MinIO instance works
   * out of the box. Best-effort: logs and continues rather than blocking
   * service startup, since a real AWS S3 bucket under a scoped IAM user is
   * expected to reject bucket creation/policy calls and have its bucket
   * managed out-of-band instead.
   */
  async onModuleInit(): Promise<void> {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch {
      try {
        await this.client.send(new CreateBucketCommand({ Bucket: this.bucket }));
        this.logger.log(`Created S3 bucket "${this.bucket}"`);
      } catch (error) {
        this.logger.warn(
          `Could not create/verify S3 bucket "${this.bucket}" — leaving bucket policy untouched: ${(error as Error).message}`,
        );
        return;
      }
    }

    try {
      await this.client.send(
        new PutBucketPolicyCommand({
          Bucket: this.bucket,
          Policy: JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Principal: '*',
                Action: ['s3:GetObject'],
                Resource: [`arn:aws:s3:::${this.bucket}/*`],
              },
            ],
          }),
        }),
      );
    } catch (error) {
      this.logger.warn(
        `Could not set public-read policy on bucket "${this.bucket}": ${(error as Error).message}`,
      );
    }

    try {
      await this.client.send(
        new PutBucketCorsCommand({
          Bucket: this.bucket,
          CORSConfiguration: {
            CORSRules: [
              {
                AllowedMethods: ['GET', 'HEAD'],
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
