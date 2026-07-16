import { Body, Controller, Get, Headers, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser, Public, Roles } from '@app/auth';
import { PaginationQueryDto } from '@app/common';
import { CheckoutDto, PaymentService, RefundRequestDto } from './payment.service';

@ApiTags('payments')
@Controller('payments')
export class PaymentController {
  constructor(private readonly payments: PaymentService) {}

  @Post('checkout')
  checkout(@CurrentUser('sub') userId: string, @Body() body: CheckoutDto) {
    return this.payments.checkout(userId, body);
  }

  @Get('history')
  history(@CurrentUser('sub') userId: string, @Query() query: PaginationQueryDto) {
    return this.payments.history(userId, query);
  }

  @Get('verify/:id')
  verify(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.payments.verify(userId, id);
  }

  /** Demo-only: simulates the provider webhook confirming this payment — see
   * PaymentService.confirmPayment's doc comment. */
  @Post('confirm/:invoiceId')
  confirm(@CurrentUser('sub') userId: string, @Param('invoiceId') invoiceId: string) {
    return this.payments.confirmPayment(userId, invoiceId);
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
