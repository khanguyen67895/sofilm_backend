import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '@app/common';
import { User } from './user.entity';
import { Device } from './device.entity';

@Entity('refresh_tokens')
export class RefreshToken extends BaseEntity {
  @ManyToOne(() => User, (user) => user.refreshTokens, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Device, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'device_id' })
  device?: Device;

  @Column({ name: 'token_hash' })
  tokenHash: string;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt: Date;

  @Column({ default: false })
  revoked: boolean;
}
