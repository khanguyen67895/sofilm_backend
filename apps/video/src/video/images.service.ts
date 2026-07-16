import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { CreateImageUploadUrlDto } from './dto/create-image-upload-url.dto';
import { S3Service } from './s3.service';

/**
 * Plain image uploads (poster/backdrop/thumbnail) — deliberately NOT backed
 * by a `Video` row or the transcode queue. Unlike video, an image needs no
 * async processing, so there's no "complete" step: the presigned PUT URL and
 * the final public URL are both handed back up front.
 */
@Injectable()
export class ImagesService {
  constructor(private readonly s3: S3Service) {}

  async createUploadUrl(
    dto: CreateImageUploadUrlDto,
  ): Promise<{ uploadUrl: string; publicUrl: string }> {
    const key = `images/${uuidv4()}-${dto.filename}`;
    const uploadUrl = await this.s3.getUploadUrl(key, dto.contentType);
    const publicUrl = this.s3.getPublicUrl(key);
    return { uploadUrl, publicUrl };
  }
}
