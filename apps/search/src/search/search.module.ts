import { Module } from '@nestjs/common';
import { ElasticsearchModule } from '../elasticsearch/elasticsearch.module';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';

@Module({
  imports: [ElasticsearchModule],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}
