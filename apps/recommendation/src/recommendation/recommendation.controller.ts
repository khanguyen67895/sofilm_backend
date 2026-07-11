import { Controller, Get, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { CurrentUser } from '@app/auth';
import { RecommendationService } from './recommendation.service';

@ApiTags('recommendations')
@ApiBearerAuth()
@Controller('recommendations')
export class RecommendationController {
  constructor(private readonly recommendationService: RecommendationService) {}

  @Get('because-you-watched')
  @ApiOperation({ summary: 'Recommendations based on the title this user most recently watched' })
  becauseYouWatched(@CurrentUser('sub') userId: string, @Req() req: Request) {
    return this.recommendationService.becauseYouWatched(userId, req.headers.authorization);
  }

  @Get('top-picks')
  @ApiOperation({ summary: "Personalized picks built from the user's liked movies/genres" })
  topPicks(@CurrentUser('sub') userId: string, @Req() req: Request) {
    return this.recommendationService.topPicks(userId, req.headers.authorization);
  }

  @Get('trending-for-you')
  @ApiOperation({ summary: 'Global trending, re-ranked toward this user’s liked genres' })
  trendingForYou(@CurrentUser('sub') userId: string, @Req() req: Request) {
    return this.recommendationService.trendingForYou(userId, req.headers.authorization);
  }

  @Get('continue-watching')
  @ApiOperation({
    summary:
      'Continue-watching passthrough — history-service is the source of truth; mirrored here for a single recommendations surface',
  })
  continueWatching(@Req() req: Request, @Query() query: Record<string, unknown>) {
    return this.recommendationService.continueWatching(req.headers.authorization, query);
  }
}
