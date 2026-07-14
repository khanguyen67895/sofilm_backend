import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, Length, Matches } from 'class-validator';

const PHONE_PATTERN = /^0\d{9,10}$/;

export class RequestOtpDto {
  @ApiProperty()
  @IsEmail()
  email: string;
}

export class VerifyOtpDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  @Length(4, 8)
  code: string;
}

export class RequestPhoneOtpDto {
  @ApiProperty({ example: '0912345678' })
  @IsString()
  @Matches(PHONE_PATTERN, { message: 'phone must be a valid phone number' })
  phone: string;
}

export class VerifyPhoneOtpDto {
  @ApiProperty({ example: '0912345678' })
  @IsString()
  @Matches(PHONE_PATTERN, { message: 'phone must be a valid phone number' })
  phone: string;

  @ApiProperty()
  @IsString()
  @Length(4, 8)
  code: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  deviceId?: string;
}
