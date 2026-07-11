import { Column, Entity, ManyToMany } from 'typeorm';
import { BaseEntity } from '@app/common';
import { Movie } from './movie.entity';

@Entity('actors')
export class Actor extends BaseEntity {
  @Column()
  name: string;

  @Column({ nullable: true })
  avatar?: string;

  @Column({ type: 'text', nullable: true })
  bio?: string;

  @ManyToMany(() => Movie, (movie) => movie.actors)
  movies: Movie[];
}
