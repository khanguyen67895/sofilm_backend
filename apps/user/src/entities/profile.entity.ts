import { Column, Entity, Index } from 'typeorm';
import { BaseEntity, SubscriptionTier } from '@app/common';

@Entity('profiles')
export class Profile extends BaseEntity {
  /** Correlates to the User.id row owned by auth-service's own database — no cross-database FK. */
  @Column({ unique: true })
  @Index()
  userId: string;

  @Column({ default: '' })
  displayName: string;

  @Column({ nullable: true })
  avatar?: string;

  @Column({ type: 'text', nullable: true })
  bio?: string;

  @Column({ type: 'date', nullable: true })
  dateOfBirth?: string;

  @Column({ nullable: true })
  gender?: string;

  @Column({ nullable: true })
  country?: string;

  /** Denormalized read-cache of the user's plan — payment-service is the source of
   * truth and syncs this via PATCH /users/me/subscription after a purchase. */
  @Column({ type: 'enum', enum: SubscriptionTier, default: SubscriptionTier.FREE })
  subscriptionTier: SubscriptionTier;

  @Column({ type: 'timestamptz', nullable: true })
  subscriptionExpiresAt?: Date;
}
