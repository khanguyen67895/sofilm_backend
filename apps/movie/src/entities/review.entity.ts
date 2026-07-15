import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseEntity } from '@app/common';
import { Movie } from './movie.entity';

@Entity('reviews')
@Unique(['movie', 'userId'])
export class Review extends BaseEntity {
  @ManyToOne(() => Movie, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'movie_id' })
  movie: Movie;

  @Index()
  @Column({ name: 'user_id' })
  userId: string;

  /** Nullable — a row can be a comment with no rating, or a rating with no comment. */
  @Column({ type: 'float', nullable: true })
  rating?: number;

  @Column({ type: 'text', nullable: true })
  comment?: string;

  /** Simple like toggle — a plain user-id list rather than a join table, given the small scale. */
  @Column({ name: 'liked_by_user_ids', type: 'simple-array', default: '' })
  likedByUserIds: string[];
}
