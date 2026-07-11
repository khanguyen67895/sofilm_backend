import { Column, Entity } from 'typeorm';
import { BaseEntity } from '@app/common';

@Entity('genres')
export class Genre extends BaseEntity {
  @Column({ unique: true })
  name: string;

  @Column({ unique: true })
  slug: string;
}
