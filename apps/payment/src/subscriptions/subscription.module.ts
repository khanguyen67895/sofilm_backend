import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscriptionPlan } from '../entities/subscription-plan.entity';
import { UserSubscription } from '../entities/user-subscription.entity';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionPlanService, SubscriptionService } from './subscription.service';

@Module({
  imports: [TypeOrmModule.forFeature([SubscriptionPlan, UserSubscription])],
  controllers: [SubscriptionController],
  providers: [SubscriptionPlanService, SubscriptionService],
  exports: [SubscriptionPlanService, SubscriptionService],
})
export class SubscriptionModule {}
