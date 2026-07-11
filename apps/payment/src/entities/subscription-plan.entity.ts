import { Column, Entity } from 'typeorm';
import { BaseEntity, SubscriptionTier } from '@app/common';

@Entity('subscription_plans')
export class SubscriptionPlan extends BaseEntity {
  @Column()
  name: string;

  @Column({ type: 'enum', enum: SubscriptionTier, default: SubscriptionTier.FREE })
  tier: SubscriptionTier;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  price: number;

  @Column({ default: 'VND' })
  currency: string;

  @Column({ name: 'duration_days', type: 'int' })
  durationDays: number;

  @Column({ type: 'simple-array', nullable: true })
  perks?: string[];

  @Column({ default: true })
  isActive: boolean;
}
