import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '@app/common';
import { Video } from './video.entity';

@Entity('shorts')
export class Short extends BaseEntity {
  @Column()
  title: string;

  /** Caption shown under the title on the vertical feed. */
  @Column({ type: 'text', nullable: true })
  content?: string;

  /** Explicit poster image for this short — takes priority over the parent
   * video's own auto-generated thumbnail. Uploaded the same way as movie
   * poster/backdrop (presigned S3 URL, no processing step). */
  @Column({ name: 'thumbnail_url', nullable: true })
  thumbnailUrl?: string;

  @ManyToOne(() => Video)
  @JoinColumn({ name: 'video_id' })
  video: Video;

  /** Denormalized cache of the parent movie's slug (movie-service owns the real
   * record, in its own database) — lets the feed link back without a cross-service call.
   * Optional: a short doesn't have to be tied to a movie. */
  @Column({ name: 'movie_slug', nullable: true })
  movieSlug?: string;

  @Column({ name: 'likes_count', default: 0 })
  likesCount: number;

  @Column({ name: 'comments_count', default: 0 })
  commentsCount: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;
}
