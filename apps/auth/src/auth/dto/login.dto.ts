import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { DevicePlatform } from '../../entities/device.entity';

export class LoginDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  password: string;

  @ApiPropertyOptional({ description: 'Stable client-generated device identifier' })
  @IsOptional()
  @IsString()
  deviceId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  deviceName?: string;

  @ApiPropertyOptional({ enum: DevicePlatform })
  @IsOptional()
  @IsEnum(DevicePlatform)
  platform?: DevicePlatform;
}
