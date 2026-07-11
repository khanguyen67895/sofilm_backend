import { Column, Entity, JoinTable, ManyToMany } from 'typeorm';
import { BaseEntity } from '@app/common';
import { Permission } from './permission.entity';
import { User } from './user.entity';

@Entity('roles')
export class Role extends BaseEntity {
  @Column({ unique: true })
  name: string; // USER | MODERATOR | ADMIN

  @ManyToMany(() => Permission, (permission) => permission.roles, { cascade: true })
  @JoinTable({ name: 'role_permissions' })
  permissions: Permission[];

  @ManyToMany(() => User, (user) => user.roles)
  users: User[];
}
