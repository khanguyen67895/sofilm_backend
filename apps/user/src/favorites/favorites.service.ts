import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { firstValueFrom } from 'rxjs';
import { Repository } from 'typeorm';
import { Favorite } from '../entities/favorite.entity';

@Injectable()
export class FavoritesService {
  private readonly movieServiceUrl: string;

  constructor(
    @InjectRepository(Favorite) private readonly favorites: Repository<Favorite>,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.movieServiceUrl =
      this.configService.get<string>('MOVIE_SERVICE_URL') ?? 'http://localhost:3003';
  }

  /** List this user's favorite movieIds, hydrated with full movie details from movie-service. */
  async list(userId: string): Promise<unknown[]> {
    const favorites = await this.favorites.find({ where: { userId } });
    const movieIds = favorites.map((favorite) => favorite.movieId);
    if (!movieIds.length) return [];

    const response = await firstValueFrom(
      this.httpService.post(`${this.movieServiceUrl}/movies/batch`, { ids: movieIds }),
    );
    return response.data;
  }

  /** Idempotent — no-op if the movie is already favorited. */
  async add(userId: string, movieId: string): Promise<Favorite> {
    const existing = await this.favorites.findOne({ where: { userId, movieId } });
    if (existing) return existing;
    return this.favorites.save(this.favorites.create({ userId, movieId }));
  }

  async remove(userId: string, movieId: string): Promise<void> {
    await this.favorites.delete({ userId, movieId });
  }
}
