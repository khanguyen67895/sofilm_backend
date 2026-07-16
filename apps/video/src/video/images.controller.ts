import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '@app/auth';
import { CreateImageUploadUrlDto } from './dto/create-image-upload-url.dto';
import { ImagesService } from './images.service';

@ApiTags('images')
@Controller('images')
export class ImagesController {
  constructor(private readonly imagesService: ImagesService) {}

  @Roles('ADMIN')
  @Post('upload-url')
  @ApiOperation({
    summary:
      'Presigned S3 upload URL for a plain image (poster/backdrop/thumbnail) — publicUrl is usable immediately once the client PUTs the file, no processing/complete step needed',
  })
  createUploadUrl(@Body() dto: CreateImageUploadUrlDto) {
    return this.imagesService.createUploadUrl(dto);
  }
}
