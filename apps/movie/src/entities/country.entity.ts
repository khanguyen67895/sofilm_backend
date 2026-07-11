import { Column, Entity } from 'typeorm';
import { BaseEntity } from '@app/common';

@Entity('countries')
export class Country extends BaseEntity {
  @Column({ unique: true })
  name: string;

  @Column({ unique: true, length: 2 })
  code: string;
}
