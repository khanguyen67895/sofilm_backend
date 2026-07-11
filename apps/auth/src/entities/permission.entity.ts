import { Column, Entity, ManyToMany } from 'typeorm';
import { BaseEntity } from '@app/common';
import { Role } from './role.entity';

@Entity('permissions')
export class Permission extends BaseEntity {
  @Column({ unique: true })
  key: string; // e.g. "movie:write", "user:ban"

  @Column({ nullable: true })
  description?: string;

  @ManyToMany(() => Role, (role) => role.permissions)
  roles: Role[];
}
