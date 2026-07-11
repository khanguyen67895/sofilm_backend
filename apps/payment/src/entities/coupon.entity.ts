import { Column, Entity } from 'typeorm';
import { BaseEntity } from '@app/common';

@Entity('coupons')
export class Coupon extends BaseEntity {
  @Column({ unique: true })
  code: string;

  @Column({ name: 'discount_percent', type: 'int', nullable: true })
  discountPercent?: number;

  @Column({ name: 'discount_amount', type: 'numeric', precision: 12, scale: 2, nullable: true })
  discountAmount?: number;

  @Column({ name: 'max_redemptions', type: 'int', nullable: true })
  maxRedemptions?: number;

  @Column({ name: 'redeemed_count', type: 'int', default: 0 })
  redeemedCount: number;

  @Column({ name: 'expires_at', type: 'timestamptz', nullable: true })
  expiresAt?: Date;

  @Column({ default: true })
  isActive: boolean;
}
