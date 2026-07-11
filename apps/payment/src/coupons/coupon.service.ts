import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CrudService } from '@app/common';
import { Coupon } from '../entities/coupon.entity';

@Injectable()
export class CouponService extends CrudService<Coupon> {
  constructor(@InjectRepository(Coupon) repo: Repository<Coupon>) {
    super(repo);
  }

  async findByCode(code: string): Promise<Coupon | null> {
    return this.repository.findOne({ where: { code } });
  }

  /** Existence, active flag, expiry, and remaining-redemptions check. */
  async checkValidity(
    code: string,
  ): Promise<{ valid: boolean; discountPercent?: number; discountAmount?: number }> {
    const coupon = await this.findByCode(code);
    if (!coupon) return { valid: false };
    if (!coupon.isActive) return { valid: false };
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) return { valid: false };
    if (coupon.maxRedemptions != null && coupon.redeemedCount >= coupon.maxRedemptions) {
      return { valid: false };
    }
    return {
      valid: true,
      discountPercent: coupon.discountPercent ?? undefined,
      discountAmount: coupon.discountAmount ?? undefined,
    };
  }

  async redeem(id: string): Promise<void> {
    await this.repository.increment({ id }, 'redeemedCount', 1);
  }
}
