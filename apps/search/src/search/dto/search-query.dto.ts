import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '@app/common';

export enum SearchType {
  MOVIE = 'MOVIE',
  ACTOR = 'ACTOR',
  GENRE = 'GENRE',
  TAG = 'TAG',
  DIRECTOR = 'DIRECTOR',
}

export class SearchQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Free-text search query' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ enum: SearchType, default: SearchType.MOVIE })
  @IsOptional()
  @IsEnum(SearchType)
  type: SearchType = SearchType.MOVIE;
}
