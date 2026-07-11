import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Invoice } from '../entities/invoice.entity';
import { PaymentProvider } from './payment-provider.interface';

@Injectable()
export class VnpayProvider implements PaymentProvider {
  constructor(private readonly config: ConfigService) {}

  async createCheckout(invoice: Invoice): Promise<{ redirectUrl: string }> {
    const tmnCode = this.config.get<string>('payment.vnpay.tmnCode');
    const hashSecret = this.config.get<string>('payment.vnpay.hashSecret');
    // TODO: call the real VNPay SDK/API here using the configured credentials
    // (build the vnp_* query string and sign it with hashSecret via HMAC-SHA512).
    void tmnCode;
    void hashSecret;
    return { redirectUrl: `https://checkout.vnpay.example/session/${invoice.id}` };
  }

  async verifyWebhook(
    payload: any,
    headers: Record<string, string>,
  ): Promise<{ success: boolean; providerTransactionId: string }> {
    // TODO: replace this trivial check with real VNPay IPN signature verification
    // (recompute HMAC-SHA512 over the sorted vnp_* params with hashSecret and
    // compare against payload.vnp_SecureHash).
    void headers;
    void payload?.vnp_SecureHash;
    return {
      success: true,
      providerTransactionId:
        payload?.transactionId ?? payload?.vnp_TransactionNo ?? `stub-${Date.now()}`,
    };
  }
}
