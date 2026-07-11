import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '@app/common';
import { Payment } from './payment.entity';

export enum RefundStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

@Entity('refunds')
export class Refund extends BaseEntity {
  @ManyToOne(() => Payment)
  @JoinColumn({ name: 'payment_id' })
  payment: Payment;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  amount: number;

  @Column({ nullable: true })
  reason?: string;

  @Column({ type: 'enum', enum: RefundStatus, default: RefundStatus.PENDING })
  status: RefundStatus;
}
