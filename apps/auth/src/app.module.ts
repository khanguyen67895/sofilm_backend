import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@app/config';
import { DatabaseModule } from '@app/database';
import { RedisModule } from '@app/redis';
import { LoggerModule } from '@app/logger';
import { AuthLibModule, JwtAuthGuard, RolesGuard } from '@app/auth';
import { HttpExceptionFilter, LoggingInterceptor, TransformInterceptor } from '@app/common';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule,
    LoggerModule,
    RedisModule,
    DatabaseModule.forService('AUTH'),
    AuthLibModule,
    AuthModule,
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
