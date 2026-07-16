import { NestFactory } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubscriptionTier } from '@app/common';
import { AppModule } from '../app.module';
import { SubscriptionPlan } from '../entities/subscription-plan.entity';

/**
 * One-off CLI script — not a REST endpoint. Seeds the 3 plans hardcoded on
 * the frontend (src/features/subscription/constants.ts) with FIXED ids, so
 * the display copy there and the real DB rows checkout()/findById() resolve
 * against always match up. Safe to re-run: existing plans (matched by id)
 * are left untouched.
 * Usage: npm run seed:plans
 */
const PLANS = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    name: 'Monthly Plan',
    tier: SubscriptionTier.PREMIUM,
    price: 79000,
    currency: 'VND',
    durationDays: 30,
    perks: [
      'Unlimited streaming',
      'Full HD quality',
      'Watch on up to 2 devices',
      'Ad-free experience',
    ],
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    name: 'Annual Plan',
    tier: SubscriptionTier.PREMIUM,
    price: 699000,
    currency: 'VND',
    durationDays: 365,
    perks: [
      'Unlimited streaming',
      '4K Ultra HD quality',
      'Watch on up to 4 devices',
      'Ad-free experience',
      'Download for offline viewing',
      'Save 27% compared to the monthly plan',
    ],
  },
  {
    id: '33333333-3333-4333-8333-333333333333',
    name: 'VIP Plan',
    tier: SubscriptionTier.VIP,
    price: 1199000,
    currency: 'VND',
    durationDays: 365,
    perks: [
      'Everything in the Annual Plan',
      'Up to 8K quality (where available)',
      'Unlimited devices',
      'Early access to new releases',
      '24/7 priority support',
      'Complimentary Mobile Plan',
    ],
  },
];

async function run() {
  // abortOnError: false — without it, Nest calls process.exit(1) directly on a
  // bootstrap failure (e.g. bad DB credentials) before this function's own
  // catch ever runs, hiding the real error.
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
    abortOnError: false,
  });

  try {
    const plans = app.get<Repository<SubscriptionPlan>>(getRepositoryToken(SubscriptionPlan));

    for (const plan of PLANS) {
      const existing = await plans.findOne({ where: { id: plan.id } });
      if (existing) {
        console.log(`Skipped "${plan.name}" (already exists).`);
        continue;
      }
      await plans.save(plans.create({ ...plan, isActive: true }));
      console.log(`Created "${plan.name}".`);
    }
  } finally {
    await app.close();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
