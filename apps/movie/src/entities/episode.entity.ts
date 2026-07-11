import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '@app/common';
import { Season } from './season.entity';

@Entity('episodes')
export class Episode extends BaseEntity {
  @ManyToOne(() => Season, (season) => season.episodes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'season_id' })
  season: Season;

  @Column({ name: 'episode_number' })
  episodeNumber: number;

  @Column()
  title: string;

  @Column({ nullable: true })
  thumbnail?: string;

  /** Minutes. */
  @Column({ nullable: true })
  duration?: number;

  /** FK by id only — the actual media asset lives in video-service. */
  @Column({ nullable: true })
  videoId?: string;
}
