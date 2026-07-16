import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString } from 'class-validator';

export class BroadcastNotificationDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  body: string;

  @ApiPropertyOptional({ description: 'e.g. { thumbnail, link } for the notification bell UI' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
