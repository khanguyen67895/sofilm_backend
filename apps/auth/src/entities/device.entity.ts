import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '@app/common';
import { User } from './user.entity';

export enum DevicePlatform {
  WEB = 'WEB',
  IOS = 'IOS',
  ANDROID = 'ANDROID',
  TV = 'TV',
}

@Entity('devices')
@Index(['user', 'deviceId'], { unique: true })
export class Device extends BaseEntity {
  @ManyToOne(() => User, (user) => user.devices, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'device_id' })
  deviceId: string;

  @Column({ nullable: true })
  deviceName?: string;

  @Column({ type: 'enum', enum: DevicePlatform, default: DevicePlatform.WEB })
  platform: DevicePlatform;

  @Column({ nullable: true })
  pushToken?: string;

  @Column({ name: 'last_active_at', type: 'timestamptz', nullable: true })
  lastActiveAt?: Date;
}
