import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { AppModule } from './app.module';

async function bootstrap() {
  process.env.SERVICE_NAME = 'payment-service';
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const config = new DocumentBuilder()
    .setTitle('SoFilm — Payment Service')
    .setDescription(
      'Subscription plans, coupons, invoices, payments, and refunds across Stripe/PayPal/VNPay/MoMo/ZaloPay',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, config));

  const port = process.env.PAYMENT_PORT ?? 3008;
  await app.listen(port);
  console.log(`💳 payment-service listening on :${port}`);
}
bootstrap();
