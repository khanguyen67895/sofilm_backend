import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '@app/common';
import { Video } from './video.entity';

export enum VideoQualityLevel {
  Q480P = 'Q480P',
  Q720P = 'Q720P',
  Q1080P = 'Q1080P',
  Q4K = 'Q4K',
}

@Entity('video_qualities')
export class VideoQuality extends BaseEntity {
  @ManyToOne(() => Video, (video) => video.qualities, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'video_id' })
  video: Video;

  @Column({ type: 'enum', enum: VideoQualityLevel })
  quality: VideoQualityLevel;

  @Column({ name: 'hls_playlist_url' })
  hlsPlaylistUrl: string;

  @Column({ name: 'bitrate_kbps', nullable: true })
  bitrateKbps?: number;
}
