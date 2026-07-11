import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Invoice } from '../entities/invoice.entity';
import { PaymentProvider } from './payment-provider.interface';

@Injectable()
export class StripeProvider implements PaymentProvider {
  constructor(private readonly config: ConfigService) {}

  async createCheckout(invoice: Invoice): Promise<{ redirectUrl: string }> {
    const secretKey = this.config.get<string>('payment.stripe.secretKey');
    // TODO: call the real Stripe SDK/API here using the configured credentials
    // (e.g. stripe.checkout.sessions.create({ ... }, { apiKey: secretKey })).
    void secretKey;
    return { redirectUrl: `https://checkout.stripe.example/session/${invoice.id}` };
  }

  async verifyWebhook(
    payload: any,
    headers: Record<string, string>,
  ): Promise<{ success: boolean; providerTransactionId: string }> {
    const webhookSecret = this.config.get<string>('payment.stripe.webhookSecret');
    // TODO: replace this trivial check with real signature verification via
    // stripe.webhooks.constructEvent(rawBody, headers['stripe-signature'], webhookSecret).
    void webhookSecret;
    void headers['stripe-signature'];
    return {
      success: true,
      providerTransactionId: payload?.transactionId ?? `stub-${Date.now()}`,
    };
  }
}
