import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '@app/common';

/**
 * One row per (userId, movieId, episodeId) combination — the user's last known
 * playback position for a movie, or for a single episode of a series.
 *
 * NOTE: Postgres unique indexes treat NULL as distinct from any other NULL, so
 * the DB-level unique index below does not by itself prevent duplicate rows
 * when `episodeId` is NULL. The service layer is responsible for looking the
 * row up by `episodeId IS NULL` explicitly and upserting onto it, so that a
 * single-movie's progress (no episode) still behaves as a single row.
 */
@Entity('watch_progress')
@Index(['userId', 'movieId', 'episodeId'], { unique: true })
export class WatchProgress extends BaseEntity {
  @Index()
  @Column({ name: 'user_id' })
  userId: string;

  @Index()
  @Column({ name: 'movie_id' })
  movieId: string;

  @Column({ name: 'episode_id', nullable: true, type: 'varchar' })
  episodeId: string | null;

  @Column({ name: 'position_seconds', type: 'int', default: 0 })
  positionSeconds: number;

  @Column({ name: 'duration_seconds', type: 'int', nullable: true })
  durationSeconds: number | null;

  @Column({ default: false })
  completed: boolean;

  @Column({ name: 'last_watched_at', type: 'timestamptz' })
  lastWatchedAt: Date;
}
