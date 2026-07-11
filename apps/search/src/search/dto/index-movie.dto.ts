import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';
import { MovieSearchDocument } from '../interfaces/movie-search-document.interface';

export class IndexMovieDto implements MovieSearchDocument {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty()
  @IsString()
  slug: string;

  @ApiProperty()
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  originalTitle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  poster?: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  genres: string[];

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  tags: string[];

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  actors: string[];

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  directors: string[];

  @ApiProperty()
  @IsBoolean()
  isPremium: boolean;

  @ApiProperty()
  @IsNumber()
  rating: number;
}
