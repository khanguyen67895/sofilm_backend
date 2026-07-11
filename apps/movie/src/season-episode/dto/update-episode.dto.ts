import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString } from 'class-validator';

export class UpdateEpisodeDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  episodeNumber?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

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
