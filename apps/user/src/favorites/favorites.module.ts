import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Favorite } from '../entities/favorite.entity';
import { FavoriteController } from './favorites.controller';
import { FavoritesService } from './favorites.service';

@Module({
  imports: [TypeOrmModule.forFeature([Favorite]), HttpModule.register({ timeout: 10000 })],
  controllers: [FavoriteController],
  providers: [FavoritesService],
})
export class FavoritesModule {}
