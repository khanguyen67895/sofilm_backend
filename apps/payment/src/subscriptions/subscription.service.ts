import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CrudService } from '@app/common';
import { SubscriptionPlan } from '../entities/subscription-plan.entity';
import { UserSubscription, UserSubscriptionStatus } from '../entities/user-subscription.entity';

@Injectable()
export class SubscriptionPlanService extends CrudService<SubscriptionPlan> {
  constructor(@InjectRepository(SubscriptionPlan) repo: Repository<SubscriptionPlan>) {
    super(repo);
  }

  async findActive(): Promise<SubscriptionPlan[]> {
    return this.repository.find({ where: { isActive: true } });
  }
}

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectRepository(UserSubscription)
    private readonly userSubscriptions: Repository<UserSubscription>,
  ) {}

  /** Most recent ACTIVE subscription row for this user, or null. */
  async findCurrent(userId: string): Promise<UserSubscription | null> {
    return this.userSubscriptions.findOne({
      where: { userId, status: UserSubscriptionStatus.ACTIVE },
      order: { createdAt: 'DESC' },
      relations: ['plan'],
    });
  }
}
