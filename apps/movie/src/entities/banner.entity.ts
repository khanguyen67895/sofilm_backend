import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '@app/common';
import { Movie } from './movie.entity';

@Entity('banners')
export class Banner extends BaseEntity {
  @Column()
  imageUrl: string;

  @Column({ nullable: true })
  title?: string;

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
