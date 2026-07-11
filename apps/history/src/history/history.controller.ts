import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '@app/auth';
import { PaginationQueryDto } from '@app/common';
import { HistoryService } from './history.service';
import { UpsertProgressDto } from './dto/upsert-progress.dto';

@ApiTags('history')
@ApiBearerAuth()
@Controller('history')
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  @Post('progress')
  @ApiOperation({ summary: 'Upsert watch progress (last position) for a movie or episode' })
  saveProgress(@CurrentUser('sub') userId: string, @Body() dto: UpsertProgressDto) {
    return this.historyService.upsertProgress(userId, dto);
  }

  @Get('continue-watching')
  @ApiOperation({ summary: 'Paginated, hydrated in-progress titles, most recently watched first' })
  continueWatching(@CurrentUser('sub') userId: string, @Query() query: PaginationQueryDto) {
    return this.historyService.continueWatching(userId, query);
  }

  @Get('watched')
  @ApiOperation({ summary: 'Paginated fully-watched history rows' })
  watched(@CurrentUser('sub') userId: string, @Query() query: PaginationQueryDto) {
    return this.historyService.watched(userId, query);
  }
}
