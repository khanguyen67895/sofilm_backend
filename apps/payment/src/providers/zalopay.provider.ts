import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Invoice } from '../entities/invoice.entity';
import { PaymentProvider } from './payment-provider.interface';

@Injectable()
export class ZalopayProvider implements PaymentProvider {
  constructor(private readonly config: ConfigService) {}

  async createCheckout(invoice: Invoice): Promise<{ redirectUrl: string }> {
    const appId = this.config.get<string>('payment.zalopay.appId');
    const key1 = this.config.get<string>('payment.zalopay.key1');
    // TODO: call the real ZaloPay SDK/API here using the configured credentials
    // (build the create-order request and sign it with key1 via HMAC-SHA256).
    void appId;
    void key1;
    return { redirectUrl: `https://checkout.zalopay.example/session/${invoice.id}` };
  }

  async verifyWebhook(
    payload: any,
    headers: Record<string, string>,
  ): Promise<{ success: boolean; providerTransactionId: string }> {
    const key2 = this.config.get<string>('payment.zalopay.key2');
    // TODO: replace this trivial check with real ZaloPay callback signature verification
    // (recompute HMAC-SHA256 over payload.data with key2 and compare against payload.mac).
    void key2;
    void headers;
    void payload?.mac;
    return {
      success: true,
      providerTransactionId: payload?.transactionId ?? payload?.zp_trans_id ?? `stub-${Date.now()}`,
    };
  }
}
