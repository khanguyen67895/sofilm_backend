import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '@app/common';
import { SubscriptionPlan } from './subscription-plan.entity';
import { Coupon } from './coupon.entity';

export enum InvoiceStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

@Entity('invoices')
export class Invoice extends BaseEntity {
  @Column({ name: 'user_id' })
  @Index()
  userId: string;

  @ManyToOne(() => SubscriptionPlan)
  @JoinColumn({ name: 'plan_id' })
  plan: SubscriptionPlan;

  @ManyToOne(() => Coupon, { nullable: true })
  @JoinColumn({ name: 'coupon_id' })
  coupon?: Coupon;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  amount: number;

  @Column()
  currency: string;

  @Column({ type: 'enum', enum: InvoiceStatus, default: InvoiceStatus.PENDING })
  status: InvoiceStatus;
}
