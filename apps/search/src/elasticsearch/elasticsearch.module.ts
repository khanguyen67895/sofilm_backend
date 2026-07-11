import { Global, Module } from '@nestjs/common';
import { ElasticsearchProvider, ELASTICSEARCH_CLIENT } from './elasticsearch.provider';
import { IndexInitializerService } from './index-initializer.service';

/**
 * Thin wrapper around the official `@elastic/elasticsearch` client (NOT
 * `@nestjs/elasticsearch`, which isn't a workspace dependency). `@Global()`
 * so any provider in this app can `@Inject(ELASTICSEARCH_CLIENT)` without
 * re-importing this module everywhere.
 */
@Global()
@Module({
  providers: [ElasticsearchProvider, IndexInitializerService],
  exports: [ELASTICSEARCH_CLIENT],
})
export class ElasticsearchModule {}
