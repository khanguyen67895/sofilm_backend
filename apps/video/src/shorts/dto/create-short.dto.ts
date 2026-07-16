import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateShortDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  videoId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  movieSlug?: string;
}
