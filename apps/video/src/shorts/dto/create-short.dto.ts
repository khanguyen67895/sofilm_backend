import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateShortDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  videoId: string;

  @ApiProperty()
  @IsString()
  movieSlug: string;
}
