import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { NotificationType } from '../../entities/notification.entity';

export class SendNotificationDto {
  @ApiProperty()
  @IsString()
  userId: string;

  @ApiProperty({ enum: NotificationType })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  body: string;

  @ApiPropertyOptional({
    description: 'Email address, push token, or phone number (not required for IN_APP)',
  })
  @IsOptional()
  @IsString()
  to?: string;
}
