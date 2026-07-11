import { BadRequestException, Injectable } from '@nestjs/common';
import { PaymentProvider } from './payment-provider.interface';
import { StripeProvider } from './stripe.provider';
import { PaypalProvider } from './paypal.provider';
import { VnpayProvider } from './vnpay.provider';
import { MomoProvider } from './momo.provider';
import { ZalopayProvider } from './zalopay.provider';

@Injectable()
export class PaymentProviderFactory {
  constructor(
    private readonly stripe: StripeProvider,
    private readonly paypal: PaypalProvider,
    private readonly vnpay: VnpayProvider,
    private readonly momo: MomoProvider,
    private readonly zalopay: ZalopayProvider,
  ) {}

  resolve(name: string): PaymentProvider {
    switch (name?.toUpperCase()) {
      case 'STRIPE':
        return this.stripe;
      case 'PAYPAL':
        return this.paypal;
      case 'VNPAY':
        return this.vnpay;
      case 'MOMO':
        return this.momo;
      case 'ZALOPAY':
        return this.zalopay;
      default:
        throw new BadRequestException(`Unknown payment provider: ${name}`);
    }
  }
}
