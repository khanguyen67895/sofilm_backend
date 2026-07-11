import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateLikeDto {
  @ApiProperty()
  @IsString()
  movieId: string;
}
