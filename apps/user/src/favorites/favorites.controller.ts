import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '@app/auth';
import { FavoritesService } from './favorites.service';
import { CreateFavoriteDto } from './dto/create-favorite.dto';

@ApiTags('favorites')
@Controller('favorites')
export class FavoriteController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @ApiBearerAuth()
  @Get()
  @ApiOperation({ summary: "List the current user's favorite movies, hydrated from movie-service" })
  list(@CurrentUser('sub') userId: string) {
    return this.favoritesService.list(userId);
  }

  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: 'Favorite a movie (idempotent)' })
  add(@CurrentUser('sub') userId: string, @Body() dto: CreateFavoriteDto) {
    return this.favoritesService.add(userId, dto.movieId);
  }

  @ApiBearerAuth()
  @Delete(':movieId')
  @ApiOperation({ summary: 'Unfavorite a movie' })
  remove(@CurrentUser('sub') userId: string, @Param('movieId') movieId: string) {
    return this.favoritesService.remove(userId, movieId);
  }
}
