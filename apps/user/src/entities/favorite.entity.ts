import { Column, Entity, Index, Unique } from 'typeorm';
import { BaseEntity } from '@app/common';

@Entity('favorites')
@Unique(['userId', 'movieId'])
export class Favorite extends BaseEntity {
  @Column()
  @Index()
  userId: string;

  /** FK by id only, on purpose — Movie is owned by movie-service's own database. */
  @Column()
  movieId: string;
}
