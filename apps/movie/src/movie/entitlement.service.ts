import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

/**
 * Checks whether the caller has an active subscription by forwarding their bearer
 * token to payment-service's `GET /subscriptions/me` (the actual source of truth —
 * user-service's denormalized Profile.subscriptionTier is a best-effort cache that
 * can lag behind it). Fails closed: any error/missing token/expired plan means no access.
 */
@Injectable()
export class EntitlementService {
  private readonly logger = new Logger(EntitlementService.name);

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {}

  async hasActiveSubscription(authHeader?: string): Promise<boolean> {
    if (!authHeader) return false;

    const baseUrl = this.config.get<string>('PAYMENT_SERVICE_URL') ?? 'http://localhost:3008';

    try {
      const { data } = await firstValueFrom(
        this.http.get(`${baseUrl}/subscriptions/me`, {
          headers: { Authorization: authHeader },
        }),
      );
      const subscription = data?.data;
      if (!subscription) return false;
      if (subscription.expiresAt && new Date(subscription.expiresAt) < new Date()) return false;
      return true;
    } catch (err) {
      this.logger.warn(`Failed to check subscription entitlement: ${(err as Error).message}`);
      return false;
    }
  }
}
