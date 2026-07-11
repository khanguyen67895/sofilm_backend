import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { RecommendationController } from './recommendation.controller';
import { RecommendationService } from './recommendation.service';
import { CollaborativeFilteringStrategy } from './strategies/collaborative-filtering.strategy';
import { ContentBasedStrategy } from './strategies/content-based.strategy';
import { HybridStrategy } from './strategies/hybrid.strategy';

@Module({
  imports: [HttpModule.register({ timeout: 10000 })],
  controllers: [RecommendationController],
  providers: [
    RecommendationService,
    CollaborativeFilteringStrategy,
    ContentBasedStrategy,
    HybridStrategy,
  ],
})
export class RecommendationModule {}
