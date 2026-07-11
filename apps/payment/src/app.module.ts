import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@app/config';
import { DatabaseModule } from '@app/database';
import { LoggerModule } from '@app/logger';
import { AuthLibModule, JwtAuthGuard, RolesGuard } from '@app/auth';
import { HttpExceptionFilter, LoggingInterceptor, TransformInterceptor } from '@app/common';
import { SubscriptionModule } from './subscriptions/subscription.module';
import { CouponModule } from './coupons/coupon.module';
import { PaymentModule } from './payments/payment.module';

@Module({
  imports: [
    ConfigModule,
    LoggerModule,
    DatabaseModule.forService('PAYMENT'),
    AuthLibModule,
    HttpModule.register({ timeout: 10000 }),
    SubscriptionModule,
    CouponModule,
    PaymentModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
  ],
})
export class AppModule {}
