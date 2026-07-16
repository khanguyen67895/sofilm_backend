import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '@app/common';

export enum NotificationType {
  EMAIL = 'EMAIL',
  PUSH = 'PUSH',
  SMS = 'SMS',
  IN_APP = 'IN_APP',
}

@Entity('notifications')
export class Notification extends BaseEntity {
  /** Null = broadcast (e.g. "new movie/short published") — visible to every
   * user, not tied to one recipient. Set = a genuine personal notification. */
  @Index()
  @Column({ name: 'user_id', nullable: true })
  userId?: string;

  @Column({ type: 'enum', enum: NotificationType })
  type: NotificationType;

  @Column()
  title: string;

  @Column({ type: 'text' })
  body: string;

  @Column({ name: 'is_read', default: false })
  isRead: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @Column({ name: 'sent_at', type: 'timestamptz', nullable: true })
  sentAt?: Date | null;
}
