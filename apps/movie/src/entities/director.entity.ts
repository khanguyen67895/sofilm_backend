import { Column, Entity, ManyToMany } from 'typeorm';
import { BaseEntity } from '@app/common';
import { Movie } from './movie.entity';

@Entity('directors')
export class Director extends BaseEntity {
  @Column()
  name: string;

  @Column({ nullable: true })
  avatar?: string;

  @Column({ type: 'text', nullable: true })
  bio?: string;

  @ManyToMany(() => Movie, (movie) => movie.directors)
  movies: Movie[];
}
