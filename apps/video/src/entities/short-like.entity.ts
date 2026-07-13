import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '@app/common';

@Entity('short_likes')
@Index(['userId', 'shortId'], { unique: true })
export class ShortLike extends BaseEntity {
  @Index()
  @Column({ name: 'user_id' })
  userId: string;

  @Index()
  @Column({ name: 'short_id' })
  shortId: string;
}
