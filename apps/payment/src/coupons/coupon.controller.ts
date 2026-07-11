import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public, Roles } from '@app/auth';
import { Coupon } from '../entities/coupon.entity';
import { CouponService } from './coupon.service';

@ApiTags('coupons')
@Controller('coupons')
export class CouponController {
  constructor(private readonly coupons: CouponService) {}

  @Public()
  @Get(':code')
  checkValidity(@Param('code') code: string) {
    return this.coupons.checkValidity(code);
  }

  @Roles('ADMIN')
  @Post()
  create(@Body() body: Partial<Coupon>) {
    return this.coupons.create(body);
  }

  @Roles('ADMIN')
  @Patch(':id')
  update(@Param('id') id: string, @Body() body: Partial<Coupon>) {
    return this.coupons.update(id, body);
  }
}
