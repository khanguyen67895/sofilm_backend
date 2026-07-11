import { Inject, Injectable } from '@nestjs/common';
import { Client } from '@elastic/elasticsearch';
import { paginate, PaginatedResult } from '@app/common';
import { ELASTICSEARCH_CLIENT } from '../elasticsearch/elasticsearch.provider';
import { MOVIES_INDEX } from '../elasticsearch/index-initializer.service';
import { SearchQueryDto, SearchType } from './dto/search-query.dto';
import { MovieSearchDocument } from './interfaces/movie-search-document.interface';

const SEARCHABLE_FIELD_BY_TYPE: Record<
  Exclude<SearchType, SearchType.MOVIE>,
  keyof MovieSearchDocument
> = {
  [SearchType.ACTOR]: 'actors',
  [SearchType.GENRE]: 'genres',
  [SearchType.TAG]: 'tags',
  [SearchType.DIRECTOR]: 'directors',
};

@Injectable()
export class SearchService {
  constructor(@Inject(ELASTICSEARCH_CLIENT) private readonly client: Client) {}

  async search(dto: SearchQueryDto): Promise<PaginatedResult<MovieSearchDocument>> {
    const result = await this.client.search<MovieSearchDocument>({
      index: MOVIES_INDEX,
      query: this.buildQuery(dto),
      from: dto.skip,
      size: dto.limit,
    });

    const items = result.hits.hits.map((hit) => hit._source as MovieSearchDocument);
    const total =
      typeof result.hits.total === 'number' ? result.hits.total : (result.hits.total?.value ?? 0);

    return paginate(items, total, dto.page, dto.limit);
  }

  async indexMovie(doc: MovieSearchDocument): Promise<void> {
    await this.client.index({
      index: MOVIES_INDEX,
      id: doc.id,
      document: doc,
      refresh: true,
    });
  }

  async deleteMovie(id: string): Promise<void> {
    await this.client.delete({ index: MOVIES_INDEX, id }).catch(() => undefined);
  }

  private buildQuery(dto: SearchQueryDto) {
    const q = dto.q ?? '';

    if (!q) return { match_all: {} };

    if (dto.type === SearchType.MOVIE) {
      return {
        multi_match: {
          query: q,
          fields: ['title^3', 'originalTitle^2', 'actors^1', 'directors^1', 'genres^1', 'tags^1'],
        },
      };
    }

    const field = SEARCHABLE_FIELD_BY_TYPE[dto.type];
    return {
      wildcard: {
        [field]: { value: `*${q}*`, case_insensitive: true },
      },
    };
  }
}
