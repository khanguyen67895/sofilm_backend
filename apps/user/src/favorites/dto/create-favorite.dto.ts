import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateFavoriteDto {
  @ApiProperty()
  @IsString()
  movieId: string;
}
