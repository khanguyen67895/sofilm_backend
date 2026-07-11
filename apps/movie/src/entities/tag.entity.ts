import { Column, Entity } from 'typeorm';
import { BaseEntity } from '@app/common';

@Entity('tags')
export class Tag extends BaseEntity {
  @Column({ unique: true })
  name: string;

  @Column({ unique: true })
  slug: string;
}
