import { Body, Controller, Headers, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser, Public, Roles } from '@app/auth';
import { CheckoutDto, PaymentService, RefundRequestDto } from './payment.service';

@ApiTags('payments')
@Controller('payments')
export class PaymentController {
  constructor(private readonly payments: PaymentService) {}

  @Post('checkout')
  checkout(@CurrentUser('sub') userId: string, @Body() body: CheckoutDto) {
    return this.payments.checkout(userId, body);
  }

  @Public()
  @Post('webhook/:provider')
  webhook(
    @Param('provider') provider: string,
    @Body() body: any,
    @Headers() headers: Record<string, string>,
  ) {
    return this.payments.handleWebhook(provider, body, headers);
  }

  @Roles('ADMIN')
  @Post(':id/refund')
  refund(@Param('id') id: string, @Body() body: RefundRequestDto) {
    return this.payments.refund(id, body);
  }
}
