import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '@app/common';

@Entity('settings')
export class Settings extends BaseEntity {
  @Column({ unique: true })
  @Index()
  userId: string;

  @Column({ default: 'dark' })
  theme: string;

  @Column({ default: 'vi' })
  language: string;

  @Column({ default: true })
  autoplay: boolean;
}
