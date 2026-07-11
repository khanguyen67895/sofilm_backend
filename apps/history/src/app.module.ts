import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@app/config';
import { DatabaseModule } from '@app/database';
import { LoggerModule } from '@app/logger';
import { AuthLibModule, JwtAuthGuard, RolesGuard } from '@app/auth';
import { HttpExceptionFilter, LoggingInterceptor, TransformInterceptor } from '@app/common';
import { HistoryModule } from './history/history.module';

@Module({
  imports: [
    ConfigModule,
    LoggerModule,
    DatabaseModule.forService('HISTORY'),
    AuthLibModule,
    HistoryModule,
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
