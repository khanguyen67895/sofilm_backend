import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@app/config';
import { DatabaseModule } from '@app/database';
import { LoggerModule } from '@app/logger';
import { AuthLibModule, JwtAuthGuard, RolesGuard } from '@app/auth';
import { QueueModule } from '@app/queue';
import { HttpExceptionFilter, LoggingInterceptor, TransformInterceptor } from '@app/common';
import { VideoModule } from './video/video.module';
import { ShortsModule } from './shorts/shorts.module';

@Module({
  imports: [
    ConfigModule,
    LoggerModule,
    DatabaseModule.forService('VIDEO'),
    AuthLibModule,
    QueueModule.forRoot(),
    VideoModule,
    ShortsModule,
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
