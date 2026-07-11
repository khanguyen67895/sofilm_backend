import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { SubscriptionTier } from '@app/common';

/** Body sent by payment-service after a purchase completes. */
export class UpdateSubscriptionDto {
  @ApiProperty()
  @IsString()
  userId: string;

  @ApiProperty({ enum: SubscriptionTier })
  @IsEnum(SubscriptionTier)
  tier: SubscriptionTier;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
