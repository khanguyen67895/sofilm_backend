import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Review } from '../entities/review.entity';
import { Movie } from '../entities/movie.entity';
import { ReviewController } from './review.controller';
import { ReviewService } from './review.service';
import { UserHydrationService } from './user-hydration.service';

@Module({
  imports: [TypeOrmModule.forFeature([Review, Movie]), HttpModule.register({ timeout: 10000 })],
  controllers: [ReviewController],
  providers: [ReviewService, UserHydrationService],
})
export class ReviewModule {}
