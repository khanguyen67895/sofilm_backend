import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class SocialLoginDto {
  /** Provider-issued identity/access token — verified server-side before trust. */
  @ApiProperty()
  @IsString()
  token: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  deviceId?: string;
}
