import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class CreateImageUploadUrlDto {
  @ApiProperty()
  @IsString()
  filename: string;

  @ApiProperty()
  @IsString()
  @Matches(/^image\//, { message: 'contentType must be an image/* mime type' })
  contentType: string;
}
