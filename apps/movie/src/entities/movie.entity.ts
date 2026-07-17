import { Column, Entity, Index, JoinTable, ManyToMany, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '@app/common';
import { Genre } from './genre.entity';
import { Category } from './category.entity';
import { Country } from './country.entity';
import { Tag } from './tag.entity';
import { Actor } from './actor.entity';
import { Director } from './director.entity';
import { Season } from './season.entity';

export enum MovieType {
  MOVIE = 'MOVIE',
  SERIES = 'SERIES',
}

@Entity('movies')
export class Movie extends BaseEntity {
  @Column({ unique: true })
  @Index()
  slug: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  originalTitle?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ nullable: true })
  poster?: string;

  @Column({ nullable: true })
  backdrop?: string;

  @Column({ type: 'enum', enum: MovieType, default: MovieType.MOVIE })
  type: MovieType;

  @Column({ type: 'date', nullable: true })
  releaseDate?: string;

  /** Minutes — only meaningful for type=MOVIE (series duration lives on Episode). */
  @Column({ nullable: true })
  duration?: number;

  @Column({ type: 'float', default: 0 })
  rating: number;

  /** Count of reviews that carry a star rating — kept in sync alongside
   * `rating` by ReviewService.syncMovieRating, same source of truth
   * (reviews), so cards can show "★ 4.8 (128)" without a per-card query. */
  @Column({ type: 'bigint', default: 0 })
  reviewsCount: number;

  @Column({ type: 'bigint', default: 0 })
  views: number;

  /** Cheap trending signal for this scaffold — a real pipeline would derive this
   * from a rolling window of view events instead of total lifetime views. */
  @Column({ type: 'bigint', default: 0 })
  trendingScore: number;

  @Column({ default: false })
  isPremium: boolean;

  /** FK by id only, on purpose — Video is owned by video-service's own database. */
  @Column({ nullable: true })
  videoId?: string;

  @ManyToOne(() => Country, { nullable: true, eager: true })
  country?: Country;

  @ManyToMany(() => Genre, { eager: true })
  @JoinTable({ name: 'movie_genres' })
  genres: Genre[];

  @ManyToMany(() => Category, { eager: true })
  @JoinTable({ name: 'movie_categories' })
  categories: Category[];

  @ManyToMany(() => Tag, { eager: true })
  @JoinTable({ name: 'movie_tags' })
  tags: Tag[];

  @ManyToMany(() => Actor, (actor) => actor.movies)
  @JoinTable({ name: 'movie_actors' })
  actors: Actor[];

  @ManyToMany(() => Director, (director) => director.movies)
  @JoinTable({ name: 'movie_directors' })
  directors: Director[];

  @OneToMany(() => Season, (season) => season.movie, { cascade: true })
  seasons: Season[];
}
