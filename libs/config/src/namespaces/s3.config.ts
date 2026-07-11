import { registerAs } from '@nestjs/config';

export default registerAs('s3', () => ({
  endpoint: process.env.S3_ENDPOINT ?? 'http://localhost:9000',
  region: process.env.S3_REGION ?? 'us-east-1',
  accessKeyId: process.env.S3_ACCESS_KEY ?? 'sofilm',
  secretAccessKey: process.env.S3_SECRET_KEY ?? 'sofilm123',
  bucket: process.env.S3_BUCKET ?? 'sofilm-media',
  forcePathStyle: (process.env.S3_FORCE_PATH_STYLE ?? 'true') === 'true',
  cdnBaseUrl: process.env.CDN_BASE_URL ?? 'http://localhost:9000/sofilm-media',
}));
