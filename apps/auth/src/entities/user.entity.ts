import { Column, Entity, JoinTable, ManyToMany, OneToMany } from 'typeorm';
import { BaseEntity } from '@app/common';
import { Role } from './role.entity';
import { RefreshToken } from './refresh-token.entity';
import { Device } from './device.entity';

export enum AuthProvider {
  LOCAL = 'LOCAL',
  GOOGLE = 'GOOGLE',
  FACEBOOK = 'FACEBOOK',
  APPLE = 'APPLE',
}

@Entity('users')
export class User extends BaseEntity {
  @Column({ unique: true })
  email: string;

  @Column({ nullable: true, select: false })
  passwordHash?: string;

  @Column({ default: '' })
  name: string;

  @Column({ nullable: true })
  avatar?: string;

  @Column({ type: 'enum', enum: AuthProvider, default: AuthProvider.LOCAL })
  provider: AuthProvider;

  @Column({ nullable: true })
  providerId?: string;

  @Column({ default: false })
  isEmailVerified: boolean;

  @Column({ default: true })
  isActive: boolean;

  @ManyToMany(() => Role, (role) => role.users, { cascade: true })
  @JoinTable({ name: 'user_roles' })
  roles: Role[];

  @OneToMany(() => RefreshToken, (token) => token.user)
  refreshTokens: RefreshToken[];

  @OneToMany(() => Device, (device) => device.user)
  devices: Device[];
}
