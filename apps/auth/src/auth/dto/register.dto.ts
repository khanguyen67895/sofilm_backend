import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, Matches, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty()
  @IsString()
  @Matches(/^[a-zA-Z0-9_.]{3,32}$/, {
    message: 'username must be 3-32 characters (letters, numbers, underscore, dot)',
  })
  username: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @Matches(/^\+?\d{9,15}$/, { message: 'phone must be a valid phone number' })
  phone: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiPropertyOptional({ description: 'Defaults to username if omitted' })
  @IsOptional()
  @IsString()
  name?: string;
}
