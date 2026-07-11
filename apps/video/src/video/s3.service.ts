import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const UPLOAD_URL_EXPIRES_SECONDS = 900;

@Injectable()
export class S3Service {
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
