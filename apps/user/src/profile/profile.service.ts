import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { SubscriptionTier } from '@app/common';
import { Profile } from '../entities/profile.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';

@Injectable()
export class ProfileService {
  constructor(@InjectRepository(Profile) private readonly profiles: Repository<Profile>) {}

  async findOrCreate(userId: string): Promise<Profile> {
    let profile = await this.profiles.findOne({ where: { userId } });
    if (!profile) {
      profile = await this.profiles.save(this.profiles.create({ userId }));
    }
    return profile;
  }

  async update(userId: string, dto: UpdateProfileDto): Promise<Profile> {
    const profile = await this.findOrCreate(userId);
    Object.assign(profile, dto);
    return this.profiles.save(profile);
  }

  async updateAvatar(userId: string, avatarUrl: string): Promise<Profile> {
    const profile = await this.findOrCreate(userId);
    profile.avatar = avatarUrl;
    return this.profiles.save(profile);
  }

  async getSubscription(
    userId: string,
  ): Promise<{ tier: SubscriptionTier; expiresAt: Date | null }> {
    const profile = await this.findOrCreate(userId);
    return { tier: profile.subscriptionTier, expiresAt: profile.subscriptionExpiresAt ?? null };
  }

  /** Called by payment-service after a purchase — not scoped to the caller's own token. */
  async updateSubscription(dto: UpdateSubscriptionDto): Promise<Profile> {
    const profile = await this.findOrCreate(dto.userId);
    profile.subscriptionTier = dto.tier;
    profile.subscriptionExpiresAt = dto.expiresAt ? new Date(dto.expiresAt) : undefined;
    return this.profiles.save(profile);
  }

  /** Hydrates a list of user ids to display info (name/avatar) — used by review-service etc.
   * Users with no profile row yet are simply omitted rather than auto-created. */
  async batchByUserIds(
    ids: string[],
  ): Promise<Array<{ userId: string; displayName: string; avatar?: string }>> {
    if (!ids?.length) return [];
    const profiles = await this.profiles.find({ where: { userId: In([...new Set(ids)]) } });
    return profiles.map((p) => ({
      userId: p.userId,
      displayName: p.displayName,
      avatar: p.avatar,
    }));
  }
}
