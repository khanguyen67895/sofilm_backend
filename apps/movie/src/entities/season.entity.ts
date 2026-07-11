import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '@app/common';
import { Movie } from './movie.entity';
import { Episode } from './episode.entity';

@Entity('seasons')
export class Season extends BaseEntity {
  @ManyToOne(() => Movie, (movie) => movie.seasons, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'movie_id' })
  movie: Movie;

  @Column({ name: 'season_number' })
  seasonNumber: number;

  @Column({ nullable: true })
  title?: string;

  @OneToMany(() => Episode, (episode) => episode.season, { cascade: true, eager: true })
  episodes: Episode[];
}
