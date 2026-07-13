import { HttpService } from '@nestjs/axios';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { firstValueFrom } from 'rxjs';
import { Repository } from 'typeorm';
import { PaginatedResult, PaginationQueryDto, paginate } from '@app/common';
import { Coupon } from '../entities/coupon.entity';
import { Invoice, InvoiceStatus } from '../entities/invoice.entity';
import { Payment, PaymentProviderName, PaymentStatus } from '../entities/payment.entity';
import { Refund, RefundStatus } from '../entities/refund.entity';
import { UserSubscription, UserSubscriptionStatus } from '../entities/user-subscription.entity';
import { SubscriptionPlanService } from '../subscriptions/subscription.service';
import { CouponService } from '../coupons/coupon.service';
import { PaymentProviderFactory } from '../providers/payment-provider.factory';

export interface CheckoutDto {
  planId: string;
  provider: string;
  couponCode?: string;
}

export interface RefundRequestDto {
  amount?: number;
  reason?: string;
}

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    @InjectRepository(Invoice) private readonly invoices: Repository<Invoice>,
    @InjectRepository(Payment) private readonly payments: Repository<Payment>,
    @InjectRepository(Refund) private readonly refunds: Repository<Refund>,
    @InjectRepository(UserSubscription)
    private readonly userSubscriptions: Repository<UserSubscription>,
    private readonly plans: SubscriptionPlanService,
    private readonly coupons: CouponService,
    private readonly providerFactory: PaymentProviderFactory,
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {}

  async history(userId: string, query: PaginationQueryDto): Promise<PaginatedResult<Invoice>> {
    const [items, total] = await this.invoices.findAndCount({
      where: { userId },
      relations: ['plan', 'coupon'],
      order: { createdAt: 'DESC' },
      skip: query.skip,
      take: query.limit,
    });
    return paginate(items, total, query.page, query.limit);
  }

  async verify(userId: string, invoiceId: string): Promise<Invoice> {
    const invoice = await this.invoices.findOne({
      where: { id: invoiceId },
      relations: ['plan', 'coupon'],
    });
    if (!invoice) throw new NotFoundException(`Invoice "${invoiceId}" not found`);
    if (invoice.userId !== userId) throw new ForbiddenException();
    return invoice;
  }

  async checkout(
    userId: string,
    dto: CheckoutDto,
  ): Promise<{ invoiceId: string; redirectUrl: string }> {
    const plan = await this.plans.findById(dto.planId);

    let amount = Number(plan.price);
    let coupon: Coupon | null = null;

    if (dto.couponCode) {
      const validity = await this.coupons.checkValidity(dto.couponCode);
      if (!validity.valid) {
        throw new BadRequestException('Coupon is not valid');
      }
      coupon = await this.coupons.findByCode(dto.couponCode);
      if (validity.discountPercent) {
        amount = amount - (amount * validity.discountPercent) / 100;
      } else if (validity.discountAmount) {
        amount = amount - validity.discountAmount;
      }
      amount = Math.max(0, amount);
    }

    const invoice = await this.invoices.save(
      this.invoices.create({
        userId,
        plan,
        coupon: coupon ?? undefined,
        amount,
        currency: plan.currency,
        status: InvoiceStatus.PENDING,
      }),
    );

    if (coupon) {
      await this.coupons.redeem(coupon.id);
    }

    const provider = this.providerFactory.resolve(dto.provider);
    const { redirectUrl } = await provider.createCheckout(invoice);

    await this.payments.save(
      this.payments.create({
        invoice,
        provider: dto.provider.toUpperCase() as PaymentProviderName,
        amount,
        status: PaymentStatus.PENDING,
      }),
    );

    return { invoiceId: invoice.id, redirectUrl };
  }

  async handleWebhook(
    providerName: string,
    body: any,
    headers: Record<string, string>,
  ): Promise<{ success: boolean }> {
    const provider = this.providerFactory.resolve(providerName);
    const result = await provider.verifyWebhook(body, headers);
    if (!result.success) {
      return { success: false };
    }

    // Match by invoiceId when the provider payload carries one; otherwise, for this
    // stub implementation, fall back to the most recent PENDING payment overall.
    const invoiceId = body?.invoiceId;
    const payment = invoiceId
      ? await this.payments.findOne({
          where: { invoice: { id: invoiceId }, status: PaymentStatus.PENDING },
          relations: ['invoice', 'invoice.plan'],
          order: { createdAt: 'DESC' },
        })
      : await this.payments.findOne({
          where: { status: PaymentStatus.PENDING },
          relations: ['invoice', 'invoice.plan'],
          order: { createdAt: 'DESC' },
        });

    if (!payment) {
      throw new NotFoundException('No pending payment found to reconcile with this webhook');
    }

    payment.status = PaymentStatus.SUCCESS;
    payment.providerTransactionId = result.providerTransactionId;
    payment.rawResponse = body;
    await this.payments.save(payment);

    const invoice = payment.invoice;
    invoice.status = InvoiceStatus.PAID;
    await this.invoices.save(invoice);

    const plan = invoice.plan;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

    let subscription = await this.userSubscriptions.findOne({
      where: { userId: invoice.userId, status: UserSubscriptionStatus.ACTIVE },
      order: { createdAt: 'DESC' },
    });
    if (subscription) {
      subscription.plan = plan;
      subscription.startedAt = now;
      subscription.expiresAt = expiresAt;
    } else {
      subscription = this.userSubscriptions.create({
        userId: invoice.userId,
        plan,
        status: UserSubscriptionStatus.ACTIVE,
        startedAt: now,
        expiresAt,
      });
    }
    await this.userSubscriptions.save(subscription);

    try {
      const userServiceUrl = this.config.get<string>('USER_SERVICE_URL') ?? 'http://localhost:3002';
      await firstValueFrom(
        this.http.patch(`${userServiceUrl}/users/me/subscription`, {
          userId: invoice.userId,
          tier: plan.tier,
          expiresAt: expiresAt.toISOString(),
        }),
      );
    } catch (err) {
      this.logger.warn(
        `Failed to sync subscription tier for user "${invoice.userId}": ${(err as Error).message}`,
      );
    }

    return { success: true };
  }

  async refund(paymentId: string, dto: RefundRequestDto): Promise<Refund> {
    const payment = await this.payments.findOne({
      where: { id: paymentId },
      relations: ['invoice'],
    });
    if (!payment) throw new NotFoundException(`Payment ${paymentId} not found`);
    if (payment.status !== PaymentStatus.SUCCESS) {
      throw new BadRequestException('Only successful payments can be refunded');
    }

    const refundAmount = dto.amount ?? Number(payment.amount);

    const refund = await this.refunds.save(
      this.refunds.create({
        payment,
        amount: refundAmount,
        reason: dto.reason,
        status: RefundStatus.PENDING,
      }),
    );

    // TODO: call the real provider refund API here (e.g. stripe.refunds.create,
    // PayPal refund, VNPay/MoMo/ZaloPay refund endpoints) before settling this
    // scaffold immediately as COMPLETED.
    refund.status = RefundStatus.COMPLETED;
    await this.refunds.save(refund);

    // Payment's status enum has no REFUNDED value in this schema (PENDING/SUCCESS/FAILED),
    // so the Payment row is left as SUCCESS — the Refund row is the source of truth for the
    // refund itself — while the parent Invoice (which does have a REFUNDED status) is updated.
    if (payment.invoice) {
      payment.invoice.status = InvoiceStatus.REFUNDED;
      await this.invoices.save(payment.invoice);
    }

    return refund;
  }
}
