import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Movie } from '../entities/movie.entity';
import { Season } from '../entities/season.entity';
import { Episode } from '../entities/episode.entity';
import { CreateEpisodeDto } from './dto/create-episode.dto';
import { UpdateEpisodeDto } from './dto/update-episode.dto';

@Injectable()
export class EpisodeService {
  constructor(
    @InjectRepository(Movie) private readonly movies: Repository<Movie>,
    @InjectRepository(Season) private readonly seasons: Repository<Season>,
    @InjectRepository(Episode) private readonly episodes: Repository<Episode>,
  ) {}

  async findAllForMovie(movieId: string): Promise<Episode[]> {
    return this.episodes
      .createQueryBuilder('episode')
      .innerJoin('episode.season', 'season')
      .where('season.movie_id = :movieId', { movieId })
      .orderBy('episode.episodeNumber', 'ASC')
      .getMany();
  }

  async create(movieId: string, dto: CreateEpisodeDto): Promise<Episode> {
    const season = await this.findOrCreateDefaultSeason(movieId);
    const episode = this.episodes.create({ ...dto, season });
    return this.episodes.save(episode);
  }

  async update(movieId: string, episodeId: string, dto: UpdateEpisodeDto): Promise<Episode> {
    const episode = await this.findOneForMovie(movieId, episodeId);
    Object.assign(episode, dto);
    return this.episodes.save(episode);
  }

  async remove(movieId: string, episodeId: string): Promise<void> {
    const episode = await this.findOneForMovie(movieId, episodeId);
    await this.episodes.remove(episode);
  }

  private async findOneForMovie(movieId: string, episodeId: string): Promise<Episode> {
    const episode = await this.episodes
      .createQueryBuilder('episode')
      .innerJoin('episode.season', 'season')
      .where('episode.id = :episodeId', { episodeId })
      .andWhere('season.movie_id = :movieId', { movieId })
      .getOne();
    if (!episode) throw new NotFoundException(`Episode "${episodeId}" not found on this movie`);
    return episode;
  }

  private async findOrCreateDefaultSeason(movieId: string): Promise<Season> {
    const movie = await this.movies.findOneBy({ id: movieId });
    if (!movie) throw new NotFoundException(`Movie "${movieId}" not found`);

    let season = await this.seasons.findOne({
      where: { movie: { id: movieId }, seasonNumber: 1 },
    });
    if (!season) {
      season = await this.seasons.save(this.seasons.create({ movie, seasonNumber: 1 }));
    }
    return season;
  }
}
