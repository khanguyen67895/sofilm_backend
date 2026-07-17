import { PaginationQueryDto } from '@app/common';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsIn, IsOptional, IsString } from 'class-validator';

export class MovieQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  genre?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({
    enum: ['newest', 'title'],
    default: 'newest',
    description: '"title" sorts A-Z — used by the homepage "All Movies" preview.',
  })
  @IsOptional()
  @IsIn(['newest', 'title'])
  sort?: 'newest' | 'title';
}

export class BatchMoviesDto {
  /** Every field the global `ValidationPipe({ whitelist: true })` doesn't see
   * a decorator for gets silently stripped before the handler ever runs — an
   * undecorated `ids` here isn't just "unvalidated", it's a guaranteed
   * `undefined`, which is why /movies/batch always returned `[]` regardless
   * of what was actually POSTed (broke favorites/continue-watching/recommend
   * hydration, every consumer of this endpoint). */
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  ids: string[];
}
