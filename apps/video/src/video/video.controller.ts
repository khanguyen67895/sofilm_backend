import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public, Roles } from '@app/auth';
import { VideoService } from './video.service';
import { CreateUploadUrlDto } from './dto/create-upload-url.dto';
import { UpdateVideoStatusDto } from './dto/update-video-status.dto';

@ApiTags('videos')
@Controller('videos')
export class VideoController {
  constructor(private readonly videoService: VideoService) {}

  @Roles('ADMIN')
  @Post('upload-url')
  @ApiOperation({ summary: 'Create a Video row and a presigned S3 upload URL for the raw file' })
  createUploadUrl(@Body() dto: CreateUploadUrlDto) {
    return this.videoService.createUploadUrl(dto);
  }

  @Roles('ADMIN')
  @Post(':id/complete')
  @ApiOperation({ summary: 'Mark the direct-to-S3 upload as complete and enqueue transcoding' })
  complete(@Param('id') id: string) {
    return this.videoService.completeUpload(id);
  }

  @Roles('ADMIN')
  @Post(':id/generate-thumbnail')
  @ApiOperation({
    summary: 'Re-enqueue processing for a video, e.g. to (re)generate its thumbnail on demand',
  })
  generateThumbnail(@Param('id') id: string) {
    return this.videoService.generateThumbnail(id);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Full video detail including qualities/subtitles/audio tracks' })
  findOne(@Param('id') id: string) {
    return this.videoService.findById(id);
  }

  // TODO: replace with a proper internal service-to-service auth mechanism before production
  @Public()
  @Patch(':id/status')
  @ApiOperation({ summary: 'INTERNAL — called by the transcoder worker when a job finishes' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateVideoStatusDto) {
    return this.videoService.updateStatus(id, dto);
  }

  @Roles('ADMIN')
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a video' })
  remove(@Param('id') id: string) {
    return this.videoService.remove(id);
  }
}
