import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from '@app/common';
import { VideoQuality } from './video-quality.entity';
import { Subtitle } from './subtitle.entity';
import { AudioTrack } from './audio-track.entity';

export enum VideoStatus {
  UPLOADING = 'UPLOADING',
  QUEUED = 'QUEUED',
  PROCESSING = 'PROCESSING',
  READY = 'READY',
  FAILED = 'FAILED',
}

@Entity('videos')
export class Video extends BaseEntity {
  @Column({ nullable: true })
  title?: string;

  @Column({ type: 'enum', enum: VideoStatus, default: VideoStatus.UPLOADING })
  status: VideoStatus;

  /** The raw-upload S3 object key (before transcoding). */
  @Column({ name: 'original_key' })
  originalKey: string;

  /** Seconds. */
  @Column({ nullable: true })
  duration?: number;

  @Column({ name: 'has_watermark', default: false })
  hasWatermark: boolean;

  @Column({ name: 'thumbnail_url', nullable: true })
  thumbnailUrl?: string;

  /** Top-level HLS master playlist (.m3u8), set once transcoding is done. */
  @Column({ name: 'hls_master_playlist_url', nullable: true })
  hlsMasterPlaylistUrl?: string;

  @Column({ name: 'failure_reason', type: 'text', nullable: true })
  failureReason?: string;

  @OneToMany(() => VideoQuality, (quality) => quality.video, { cascade: true })
  qualities: VideoQuality[];

  @OneToMany(() => Subtitle, (subtitle) => subtitle.video, { cascade: true })
  subtitles: Subtitle[];

  @OneToMany(() => AudioTrack, (track) => track.video, { cascade: true })
  audioTracks: AudioTrack[];
}
