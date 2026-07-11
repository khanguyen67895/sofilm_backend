import { Invoice } from '../entities/invoice.entity';

export interface PaymentProvider {
  createCheckout(invoice: Invoice): Promise<{ redirectUrl: string }>;
  verifyWebhook(
    payload: any,
    headers: Record<string, string>,
  ): Promise<{ success: boolean; providerTransactionId: string }>;
}
