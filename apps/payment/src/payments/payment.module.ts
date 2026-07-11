import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invoice } from '../entities/invoice.entity';
import { Payment } from '../entities/payment.entity';
import { Refund } from '../entities/refund.entity';
import { UserSubscription } from '../entities/user-subscription.entity';
import { SubscriptionModule } from '../subscriptions/subscription.module';
import { CouponModule } from '../coupons/coupon.module';
import { ProvidersModule } from '../providers/providers.module';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Invoice, Payment, Refund, UserSubscription]),
    SubscriptionModule,
    CouponModule,
    ProvidersModule,
  ],
  controllers: [PaymentController],
  providers: [PaymentService],
})
export class PaymentModule {}
