import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '@app/common';
import { Video } from './video.entity';

@Entity('subtitles')
export class Subtitle extends BaseEntity {
  @ManyToOne(() => Video, (video) => video.subtitles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'video_id' })
  video: Video;

  /** e.g. "vi", "en". */
  @Column()
  language: string;

  @Column()
  url: string;

  @Column({ name: 'is_default', default: false })
  isDefault: boolean;
}
