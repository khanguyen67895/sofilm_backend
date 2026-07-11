import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Invoice } from '../entities/invoice.entity';
import { PaymentProvider } from './payment-provider.interface';

@Injectable()
export class PaypalProvider implements PaymentProvider {
  constructor(private readonly config: ConfigService) {}

  async createCheckout(invoice: Invoice): Promise<{ redirectUrl: string }> {
    const clientId = this.config.get<string>('payment.paypal.clientId');
    const clientSecret = this.config.get<string>('payment.paypal.clientSecret');
    // TODO: call the real PayPal SDK/API here using the configured credentials
    // (e.g. create an Orders API order with clientId/clientSecret and return its approve link).
    void clientId;
    void clientSecret;
    return { redirectUrl: `https://checkout.paypal.example/session/${invoice.id}` };
  }

  async verifyWebhook(
    payload: any,
    headers: Record<string, string>,
  ): Promise<{ success: boolean; providerTransactionId: string }> {
    // TODO: replace this trivial check with real PayPal webhook signature verification
    // (verify-webhook-signature API using headers['paypal-transmission-sig'] et al).
    void headers['paypal-transmission-sig'];
    return {
      success: true,
      providerTransactionId: payload?.transactionId ?? `stub-${Date.now()}`,
    };
  }
}
