import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateShortDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  videoId: string;

  @ApiProperty({ required: false, description: 'Caption shown under the title on the feed.' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiProperty({
    required: false,
    description: "Poster image — overrides the video's own auto-generated thumbnail.",
  })
  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  movieSlug?: string;
}
