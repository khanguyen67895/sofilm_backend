import { DynamicModule, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({})
export class QueueModule {
  /** Call once per app bootstrap (root module) to configure the shared Redis connection. */
  static forRoot(): DynamicModule {
    return {
      module: QueueModule,
      imports: [
        BullModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (config: ConfigService) => ({
            connection: {
              host: config.get<string>('redis.host'),
              port: config.get<number>('redis.port'),
              password: config.get<string>('redis.password'),
            },
          }),
        }),
      ],
      exports: [BullModule],
    };
  }

  /** Registers one or more queues for producing/consuming jobs (call from a feature module). */
  static registerQueues(...names: string[]): DynamicModule {
    return {
      module: QueueModule,
      imports: [BullModule.registerQueue(...names.map((name) => ({ name })))],
      exports: [BullModule],
    };
  }
}
