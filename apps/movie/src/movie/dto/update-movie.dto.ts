import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { MovieType } from '../../entities/movie.entity';

export class UpdateMovieDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  poster?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  backdrop?: string;

  @ApiPropertyOptional({ enum: MovieType })
  @IsOptional()
  @IsEnum(MovieType)
  type?: MovieType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  releaseDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  duration?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPremium?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  countryId?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  genreIds?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  categoryIds?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  tagIds?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  actorIds?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  directorIds?: string[];

  @ApiPropertyOptional({ description: 'video-service Video id — only meaningful for type=MOVIE' })
  @IsOptional()
  @IsString()
  videoId?: string;
}
