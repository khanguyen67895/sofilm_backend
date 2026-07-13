import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '@app/common';
import { Video } from './video.entity';

@Entity('shorts')
export class Short extends BaseEntity {
  @Column()
  title: string;

  @ManyToOne(() => Video)
  @JoinColumn({ name: 'video_id' })
  video: Video;

  /** Denormalized cache of the parent movie's slug (movie-service owns the real
   * record, in its own database) — lets the feed link back without a cross-service call. */
  @Column({ name: 'movie_slug' })
  movieSlug: string;

  @Column({ name: 'likes_count', default: 0 })
  likesCount: number;

  @Column({ name: 'comments_count', default: 0 })
  commentsCount: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;
}
