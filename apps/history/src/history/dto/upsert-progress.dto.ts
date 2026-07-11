import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpsertProgressDto {
  @ApiProperty()
  @IsString()
  movieId: string;

  @ApiPropertyOptional({ description: 'Set when the title being watched is a series episode' })
  @IsOptional()
  @IsString()
  episodeId?: string;

  @ApiProperty()
  @IsInt()
  @Min(0)
  positionSeconds: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  durationSeconds?: number;
}
