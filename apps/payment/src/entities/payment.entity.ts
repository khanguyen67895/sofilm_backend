import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '@app/common';
import { Invoice } from './invoice.entity';

export enum PaymentProviderName {
  STRIPE = 'STRIPE',
  PAYPAL = 'PAYPAL',
  VNPAY = 'VNPAY',
  MOMO = 'MOMO',
  ZALOPAY = 'ZALOPAY',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

@Entity('payments')
export class Payment extends BaseEntity {
  @ManyToOne(() => Invoice)
  @JoinColumn({ name: 'invoice_id' })
  invoice: Invoice;

  @Column({ type: 'enum', enum: PaymentProviderName })
  provider: PaymentProviderName;

  @Column({ name: 'provider_transaction_id', nullable: true })
  providerTransactionId?: string;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Column({ name: 'raw_response', type: 'jsonb', nullable: true })
  rawResponse?: Record<string, unknown>;
}
