import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '@app/common';

/** A lightweight "like" engagement signal — distinct from apps/user's curated Favorite list. */
@Entity('likes')
@Index(['userId', 'movieId'], { unique: true })
export class Like extends BaseEntity {
  @Index()
  @Column({ name: 'user_id' })
  userId: string;

  @Index()
  @Column({ name: 'movie_id' })
  movieId: string;
}
