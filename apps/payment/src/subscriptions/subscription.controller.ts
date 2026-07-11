import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser, Public, Roles } from '@app/auth';
import { SubscriptionPlan } from '../entities/subscription-plan.entity';
import { SubscriptionPlanService, SubscriptionService } from './subscription.service';

@ApiTags('subscriptions')
@Controller('subscriptions')
export class SubscriptionController {
  constructor(
    private readonly plans: SubscriptionPlanService,
    private readonly subscriptions: SubscriptionService,
  ) {}

  @Public()
  @Get('plans')
  listPlans() {
    return this.plans.findActive();
  }

  @Roles('ADMIN')
  @Post('plans')
  createPlan(@Body() body: Partial<SubscriptionPlan>) {
    return this.plans.create(body);
  }

  @Roles('ADMIN')
  @Patch('plans/:id')
  updatePlan(@Param('id') id: string, @Body() body: Partial<SubscriptionPlan>) {
    return this.plans.update(id, body);
  }

  @Get('me')
  findMine(@CurrentUser('sub') userId: string) {
    return this.subscriptions.findCurrent(userId);
  }
}
