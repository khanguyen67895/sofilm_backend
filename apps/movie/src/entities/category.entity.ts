import { Column, Entity } from 'typeorm';
import { BaseEntity } from '@app/common';

/** Programming category — e.g. "Phim Lẻ", "Phim Bộ", "Hoạt Hình", "Chiếu Rạp" — distinct from Genre. */
@Entity('categories')
export class Category extends BaseEntity {
  @Column({ unique: true })
  name: string;

  @Column({ unique: true })
  slug: string;
}
