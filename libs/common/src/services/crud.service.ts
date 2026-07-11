import { NotFoundException } from '@nestjs/common';
import { DeepPartial, FindOptionsWhere, Repository } from 'typeorm';

/** Thin CRUD base for simple lookup entities (genre, tag, category, country, ...). */
export abstract class CrudService<T extends { id: string }> {
  protected constructor(protected readonly repository: Repository<T>) {}

  async findAll(where?: FindOptionsWhere<T>): Promise<T[]> {
    return this.repository.find({ where });
  }

  async findById(id: string): Promise<T> {
    const entity = await this.repository.findOne({ where: { id } as FindOptionsWhere<T> });
    if (!entity) throw new NotFoundException(`${this.repository.metadata.name} ${id} not found`);
    return entity;
  }

  async create(data: DeepPartial<T>): Promise<T> {
    return this.repository.save(this.repository.create(data));
  }

  async update(id: string, data: DeepPartial<T>): Promise<T> {
    const entity = await this.findById(id);
    Object.assign(entity as object, data);
    return this.repository.save(entity);
  }

  async remove(id: string): Promise<void> {
    const entity = await this.findById(id);
    await this.repository.remove(entity);
  }
}
