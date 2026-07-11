import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@app/config';
import { RedisModule } from '@app/redis';
import { LoggerModule } from '@app/logger';
import { AuthLibModule, JwtAuthGuard, RolesGuard } from '@app/auth';
import { HttpExceptionFilter, LoggingInterceptor, TransformInterceptor } from '@app/common';
import { RecommendationModule } from './recommendation/recommendation.module';

@Module({
  imports: [
    ConfigModule,
    LoggerModule,
    RedisModule,
    AuthLibModule,
    // Registered app-wide so every feature module can just inject HttpService
    // without each one re-declaring its own HttpModule.register(...).
    HttpModule.register({ timeout: 10000 }),
    RecommendationModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
  ],
})
export class AppModule {}
