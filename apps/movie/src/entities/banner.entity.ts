import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '@app/common';
import { Movie } from './movie.entity';

@Entity('banners')
export class Banner extends BaseEntity {
  /** Legacy static-image banners only — new banners are video-only (videoId).
   * Kept nullable for backward compatibility with existing rows. */
  @Column({ nullable: true })
  imageUrl?: string;

  @Column({ nullable: true })
  title?: string;

  /** Short caption shown under the title on the hero — overrides the linked
   * movie's own description when set. */
  @Column({ type: 'text', nullable: true })
  content?: string;

  /** Explicit poster image for this banner — shown as the hero video's
   * `poster` while it buffers, takes priority over the legacy `imageUrl` and
   * the linked movie's own backdrop. Uploaded the same way as movie
   * poster/backdrop (presigned S3 URL, no processing step). */
  @Column({ name: 'thumbnail_url', nullable: true })
  thumbnailUrl?: string;

  /** Dedicated hero clip, uploaded directly for this banner — takes priority
   * over the linked movie's own video (video-service lookup, FK by id only,
   * same pattern as Movie/Episode/Short). Required for new banners. */
  @Column({ name: 'video_id', nullable: true })
  videoId?: string;

  @ManyToOne(() => Movie, { nullable: true, eager: true })
  @JoinColumn({ name: 'movie_id' })
  movie?: Movie;

  @Column({ default: 0 })
  order: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ name: 'start_at', type: 'timestamptz', nullable: true })
  startAt?: Date;

  @Column({ name: 'end_at', type: 'timestamptz', nullable: true })
  endAt?: Date;
}
