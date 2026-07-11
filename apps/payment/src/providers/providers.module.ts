import { Module } from '@nestjs/common';
import { StripeProvider } from './stripe.provider';
import { PaypalProvider } from './paypal.provider';
import { VnpayProvider } from './vnpay.provider';
import { MomoProvider } from './momo.provider';
import { ZalopayProvider } from './zalopay.provider';
import { PaymentProviderFactory } from './payment-provider.factory';

@Module({
  providers: [
    StripeProvider,
    PaypalProvider,
    VnpayProvider,
    MomoProvider,
    ZalopayProvider,
    PaymentProviderFactory,
  ],
  exports: [PaymentProviderFactory],
})
export class ProvidersModule {}
