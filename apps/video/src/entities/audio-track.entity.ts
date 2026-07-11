import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '@app/common';
import { Video } from './video.entity';

@Entity('audio_tracks')
export class AudioTrack extends BaseEntity {
  @ManyToOne(() => Video, (video) => video.audioTracks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'video_id' })
  video: Video;

  @Column()
  language: string;

  @Column({ name: 'is_default', default: false })
  isDefault: boolean;

  /** Separate audio-only HLS track. */
  @Column({ nullable: true })
  url?: string;
}
