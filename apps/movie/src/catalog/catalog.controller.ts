import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public, Roles } from '@app/auth';
import {
  ActorService,
  BannerService,
  CategoryService,
  CountryService,
  DirectorService,
  GenreService,
  TagService,
} from './catalog.service';

@ApiTags('genres')
@Controller('genres')
export class GenreController {
  constructor(private readonly genres: GenreService) {}

  @Public()
  @Get()
  findAll() {
    return this.genres.findAll();
  }

  @Roles('ADMIN')
  @Post()
  create(@Body() body: Partial<{ name: string; slug: string }>) {
    return this.genres.create(body);
  }

  @Roles('ADMIN')
  @Patch(':id')
  update(@Param('id') id: string, @Body() body: Partial<{ name: string; slug: string }>) {
    return this.genres.update(id, body);
  }

  @Roles('ADMIN')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.genres.remove(id);
  }
}

@ApiTags('categories')
@Controller('categories')
export class CategoryController {
  constructor(private readonly categories: CategoryService) {}

  @Public()
  @Get()
  findAll() {
    return this.categories.findAll();
  }

  @Roles('ADMIN')
  @Post()
  create(@Body() body: Partial<{ name: string; slug: string }>) {
    return this.categories.create(body);
  }
}

@ApiTags('countries')
@Controller('countries')
export class CountryController {
  constructor(private readonly countries: CountryService) {}

  @Public()
  @Get()
  findAll() {
    return this.countries.findAll();
  }

  @Roles('ADMIN')
  @Post()
  create(@Body() body: Partial<{ name: string; code: string }>) {
    return this.countries.create(body);
  }
}

@ApiTags('tags')
@Controller('tags')
export class TagController {
  constructor(private readonly tags: TagService) {}

  @Public()
  @Get()
  findAll() {
    return this.tags.findAll();
  }

  @Roles('ADMIN')
  @Post()
  create(@Body() body: Partial<{ name: string; slug: string }>) {
    return this.tags.create(body);
  }
}

@ApiTags('actors')
@Controller('actors')
export class ActorController {
  constructor(private readonly actors: ActorService) {}

  @Public()
  @Get()
  findAll() {
    return this.actors.findAll();
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.actors.findById(id);
  }

  @Roles('ADMIN')
  @Post()
  create(@Body() body: Partial<{ name: string; avatar: string; bio: string }>) {
    return this.actors.create(body);
  }
}

@ApiTags('directors')
@Controller('directors')
export class DirectorController {
  constructor(private readonly directors: DirectorService) {}

  @Public()
  @Get()
  findAll() {
    return this.directors.findAll();
  }

  @Roles('ADMIN')
  @Post()
  create(@Body() body: Partial<{ name: string; avatar: string; bio: string }>) {
    return this.directors.create(body);
  }
}

@ApiTags('banners')
@Controller('banners')
export class BannerController {
  constructor(private readonly banners: BannerService) {}

  @Public()
  @Get()
  findActive() {
    return this.banners.findActive();
  }

  @Roles('ADMIN')
  @Post()
  create(@Body() body: Partial<{ imageUrl: string; title: string; order: number }>) {
    return this.banners.create(body);
  }
}
