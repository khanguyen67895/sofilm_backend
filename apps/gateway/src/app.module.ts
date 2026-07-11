import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ConfigModule as SofilmConfigModule } from '@app/config';
import { LoggerModule } from '@app/logger';
import { AuthLibModule, JwtAuthGuard, RolesGuard } from '@app/auth';
import { HttpExceptionFilter, LoggingInterceptor } from '@app/common';
import { ProxyModule } from './proxy/proxy.module';

@Module({
  imports: [
    SofilmConfigModule,
    LoggerModule,
    AuthLibModule,
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: () => ({
        throttlers: [
          {
            ttl: Number(process.env.THROTTLE_TTL ?? 60) * 1000,
            limit: Number(process.env.THROTTLE_LIMIT ?? 100),
          },
        ],
      }),
    }),
    ProxyModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
  ],
})
export class AppModule {}
