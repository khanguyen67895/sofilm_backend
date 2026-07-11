import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '@app/common';
import { SubscriptionPlan } from './subscription-plan.entity';

export enum UserSubscriptionStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  CANCELED = 'CANCELED',
}

@Entity('user_subscriptions')
export class UserSubscription extends BaseEntity {
  @Column({ name: 'user_id' })
  @Index()
  userId: string;

  @ManyToOne(() => SubscriptionPlan)
  @JoinColumn({ name: 'plan_id' })
  plan: SubscriptionPlan;

  @Column({ type: 'enum', enum: UserSubscriptionStatus, default: UserSubscriptionStatus.ACTIVE })
  status: UserSubscriptionStatus;

  @Column({ name: 'started_at', type: 'timestamptz' })
  startedAt: Date;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt: Date;
}
