import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
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
import { CreateBannerDto, UpdateBannerDto } from './dto/banner.dto';

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
  @ApiOperation({ summary: 'Active banners for the homepage hero, in display order' })
  findActive() {
    return this.banners.findActive();
  }

  @Roles('ADMIN')
  @Get('admin/list')
  @ApiOperation({ summary: 'Every banner (active or not) for the admin hero manager' })
  findAllOrdered() {
    return this.banners.findAllOrdered();
  }

  @Roles('ADMIN')
  @Post()
  create(@Body() body: CreateBannerDto) {
    return this.banners.createBanner(body);
  }

  @Roles('ADMIN')
  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateBannerDto) {
    return this.banners.updateBanner(id, body);
  }

  @Roles('ADMIN')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.banners.remove(id);
  }
}
