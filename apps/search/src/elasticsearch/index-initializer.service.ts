import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Client } from '@elastic/elasticsearch';
import { ELASTICSEARCH_CLIENT } from './elasticsearch.provider';

export const MOVIES_INDEX = 'movies';

/**
 * Ensures the `movies` index exists on boot. If Elasticsearch isn't reachable
 * yet (e.g. still starting up in docker-compose), we log a warning instead of
 * crashing the service — search requests will simply fail until it comes up.
 */
@Injectable()
export class IndexInitializerService implements OnModuleInit {
  private readonly logger = new Logger(IndexInitializerService.name);

  constructor(@Inject(ELASTICSEARCH_CLIENT) private readonly client: Client) {}

  async onModuleInit(): Promise<void> {
    try {
      const exists = await this.client.indices.exists({ index: MOVIES_INDEX });
      if (!exists) {
        await this.client.indices.create({
          index: MOVIES_INDEX,
          mappings: {
            properties: {
              id: { type: 'keyword' },
              slug: { type: 'keyword' },
              title: {
                type: 'text',
                fields: { keyword: { type: 'keyword' } },
              },
              originalTitle: {
                type: 'text',
                fields: { keyword: { type: 'keyword' } },
              },
              poster: { type: 'keyword', index: false },
              genres: { type: 'keyword' },
              tags: { type: 'keyword' },
              actors: { type: 'keyword' },
              directors: { type: 'keyword' },
              isPremium: { type: 'boolean' },
              rating: { type: 'float' },
            },
          },
        });
        this.logger.log(`Created Elasticsearch index "${MOVIES_INDEX}"`);
      }
    } catch (err) {
      this.logger.warn(
        `Elasticsearch not reachable at boot, skipping index initialization: ${(err as Error).message}`,
      );
    }
  }
}
