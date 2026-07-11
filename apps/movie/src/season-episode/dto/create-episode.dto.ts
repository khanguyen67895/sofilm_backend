import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString } from 'class-validator';

export class CreateEpisodeDto {
  @ApiProperty()
  @IsInt()
  episodeNumber: number;

  @ApiProperty()
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  thumbnail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  duration?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  videoId?: string;
}
