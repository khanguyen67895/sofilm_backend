import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CrudService } from '@app/common';
import { Genre } from '../entities/genre.entity';
import { Category } from '../entities/category.entity';
import { Country } from '../entities/country.entity';
import { Tag } from '../entities/tag.entity';
import { Actor } from '../entities/actor.entity';
import { Director } from '../entities/director.entity';
import { Banner } from '../entities/banner.entity';

@Injectable()
export class GenreService extends CrudService<Genre> {
  constructor(@InjectRepository(Genre) repo: Repository<Genre>) {
    super(repo);
  }
}

@Injectable()
export class CategoryService extends CrudService<Category> {
  constructor(@InjectRepository(Category) repo: Repository<Category>) {
    super(repo);
  }
}

@Injectable()
export class CountryService extends CrudService<Country> {
  constructor(@InjectRepository(Country) repo: Repository<Country>) {
    super(repo);
  }
}

@Injectable()
export class TagService extends CrudService<Tag> {
  constructor(@InjectRepository(Tag) repo: Repository<Tag>) {
    super(repo);
  }
}

@Injectable()
export class ActorService extends CrudService<Actor> {
  constructor(@InjectRepository(Actor) repo: Repository<Actor>) {
    super(repo);
  }
}

@Injectable()
export class DirectorService extends CrudService<Director> {
  constructor(@InjectRepository(Director) repo: Repository<Director>) {
    super(repo);
  }
}

@Injectable()
export class BannerService extends CrudService<Banner> {
  constructor(@InjectRepository(Banner) repo: Repository<Banner>) {
    super(repo);
  }

  async findActive(): Promise<Banner[]> {
    const now = new Date();
    const banners = await this.repository.find({
      where: { isActive: true },
      order: { order: 'ASC' },
    });
    return banners.filter((b) => (!b.startAt || b.startAt <= now) && (!b.endAt || b.endAt >= now));
  }
}
