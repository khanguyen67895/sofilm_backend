import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { InjectQueue, Queue, QUEUE_NAMES, VIDEO_TRANSCODE_JOBS } from '@app/queue';
import { Video, VideoStatus } from '../entities/video.entity';
import { VideoQuality } from '../entities/video-quality.entity';
import { Subtitle } from '../entities/subtitle.entity';
import { AudioTrack } from '../entities/audio-track.entity';
import { CreateUploadUrlDto } from './dto/create-upload-url.dto';
import { UpdateVideoStatusDto } from './dto/update-video-status.dto';
import { S3Service } from './s3.service';

const DETAIL_RELATIONS = ['qualities', 'subtitles', 'audioTracks'];

@Injectable()
export class VideoService {
  constructor(
    @InjectRepository(Video) private readonly videos: Repository<Video>,
    @InjectRepository(VideoQuality) private readonly videoQualities: Repository<VideoQuality>,
    @InjectRepository(Subtitle) private readonly subtitles: Repository<Subtitle>,
    @InjectRepository(AudioTrack) private readonly audioTracks: Repository<AudioTrack>,
    @InjectQueue(QUEUE_NAMES.VIDEO_TRANSCODE) private readonly transcodeQueue: Queue,
    private readonly s3: S3Service,
  ) {}

  async createUploadUrl(
    dto: CreateUploadUrlDto,
  ): Promise<{ videoId: string; uploadUrl: string; key: string }> {
    const key = `raw/${uuidv4()}-${dto.filename}`;

    const video = this.videos.create({
      originalKey: key,
      status: VideoStatus.UPLOADING,
    });
    await this.videos.save(video);

    const uploadUrl = await this.s3.getUploadUrl(key, dto.contentType);

    return { videoId: video.id, uploadUrl, key };
  }

  async findById(id: string): Promise<Video> {
    const video = await this.videos.findOne({ where: { id }, relations: DETAIL_RELATIONS });
    if (!video) throw new NotFoundException(`Video "${id}" not found`);
    return video;
  }

  /**
   * Called by the client once the direct-to-S3 upload has finished. The transcoder is not
   * a working pipeline yet, so the raw uploaded file is served as-is via its public S3 URL
   * and the video is marked READY immediately rather than waiting on transcode output.
   */
  async completeUpload(id: string): Promise<Video> {
    const video = await this.findById(id);

    video.status = VideoStatus.READY;
    video.hlsMasterPlaylistUrl = this.s3.getPublicUrl(video.originalKey);
    await this.videos.save(video);

    try {
      await this.transcodeQueue.add(VIDEO_TRANSCODE_JOBS.PROCESS, {
        videoId: video.id,
        originalKey: video.originalKey,
      });
    } catch (err) {
      console.error(`Failed to enqueue transcode job for video "${id}"`, err);
    }

    return video;
  }

  /** Re-enqueues the same processing job used on initial upload — lets the
   * admin UI retry/regenerate a thumbnail on demand (e.g. the first attempt
   * failed, or ran before an ffmpeg binary was available). */
  async generateThumbnail(id: string): Promise<{ queued: boolean }> {
    const video = await this.findById(id);
    await this.transcodeQueue.add(VIDEO_TRANSCODE_JOBS.PROCESS, {
      videoId: video.id,
      originalKey: video.originalKey,
    });
    return { queued: true };
  }

  /** Called by the transcoder worker when a job finishes (success or failure). */
  async updateStatus(id: string, dto: UpdateVideoStatusDto): Promise<Video> {
    const video = await this.findById(id);

    video.status = dto.status;
    if (dto.thumbnailUrl !== undefined) video.thumbnailUrl = dto.thumbnailUrl;
    if (dto.hlsMasterPlaylistUrl !== undefined)
      video.hlsMasterPlaylistUrl = dto.hlsMasterPlaylistUrl;
    if (dto.duration !== undefined) video.duration = dto.duration;
    if (dto.failureReason !== undefined) video.failureReason = dto.failureReason;
    await this.videos.save(video);

    if (dto.qualities) {
      await this.videoQualities.delete({ video: { id: video.id } });
      const qualities = dto.qualities.map((q) => this.videoQualities.create({ ...q, video }));
      await this.videoQualities.save(qualities);
    }

    if (dto.subtitles) {
      await this.subtitles.delete({ video: { id: video.id } });
      const subtitles = dto.subtitles.map((s) => this.subtitles.create({ ...s, video }));
      await this.subtitles.save(subtitles);
    }

    return this.findById(id);
  }

  async remove(id: string): Promise<void> {
    const video = await this.findById(id);
    await this.videos.softRemove(video);
  }
}
