import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Invoice } from '../entities/invoice.entity';
import { PaymentProvider } from './payment-provider.interface';

@Injectable()
export class MomoProvider implements PaymentProvider {
  constructor(private readonly config: ConfigService) {}

  async createCheckout(invoice: Invoice): Promise<{ redirectUrl: string }> {
    const partnerCode = this.config.get<string>('payment.momo.partnerCode');
    const accessKey = this.config.get<string>('payment.momo.accessKey');
    const secretKey = this.config.get<string>('payment.momo.secretKey');
    // TODO: call the real MoMo SDK/API here using the configured credentials
    // (build the create-payment request and sign it with secretKey via HMAC-SHA256).
    void partnerCode;
    void accessKey;
    void secretKey;
    return { redirectUrl: `https://checkout.momo.example/session/${invoice.id}` };
  }

  async verifyWebhook(
    payload: any,
    headers: Record<string, string>,
  ): Promise<{ success: boolean; providerTransactionId: string }> {
    // TODO: replace this trivial check with real MoMo IPN signature verification
    // (recompute HMAC-SHA256 over the raw params with secretKey and compare
    // against payload.signature).
    void headers;
    void payload?.signature;
    return {
      success: true,
      providerTransactionId: payload?.transactionId ?? payload?.transId ?? `stub-${Date.now()}`,
    };
  }
}
