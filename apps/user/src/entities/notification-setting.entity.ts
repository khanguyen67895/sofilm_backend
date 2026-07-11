import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '@app/common';

@Entity('notification_settings')
export class NotificationSetting extends BaseEntity {
  @Column({ unique: true })
  @Index()
  userId: string;

  @Column({ default: true })
  emailEnabled: boolean;

  @Column({ default: true })
  pushEnabled: boolean;

  @Column({ default: false })
  smsEnabled: boolean;

  @Column({ default: true })
  inAppEnabled: boolean;
}
