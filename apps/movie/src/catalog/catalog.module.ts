import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Genre } from '../entities/genre.entity';
import { Category } from '../entities/category.entity';
import { Country } from '../entities/country.entity';
import { Tag } from '../entities/tag.entity';
import { Actor } from '../entities/actor.entity';
import { Director } from '../entities/director.entity';
import { Banner } from '../entities/banner.entity';
import { Movie } from '../entities/movie.entity';
import { MovieModule } from '../movie/movie.module';
import {
  ActorController,
  BannerController,
  CategoryController,
  CountryController,
  DirectorController,
  GenreController,
  TagController,
} from './catalog.controller';
import {
  ActorService,
  BannerService,
  CategoryService,
  CountryService,
  DirectorService,
  GenreService,
  TagService,
} from './catalog.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Genre, Category, Country, Tag, Actor, Director, Banner, Movie]),
    MovieModule,
  ],
  controllers: [
    GenreController,
    CategoryController,
    CountryController,
    TagController,
    ActorController,
    DirectorController,
    BannerController,
  ],
  providers: [
    GenreService,
    CategoryService,
    CountryService,
    TagService,
    ActorService,
    DirectorService,
    BannerService,
  ],
})
export class CatalogModule {}
