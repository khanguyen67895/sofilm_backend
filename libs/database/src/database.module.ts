import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

/**
 * One Postgres logical database per microservice ("database per service").
 * Each app calls `DatabaseModule.forService('AUTH')` and the module reads
 * `AUTH_DB_NAME` (falling back to `<service>_db`) alongside the shared
 * DB_HOST/DB_PORT/DB_USERNAME/DB_PASSWORD connection settings.
 */
@Module({})
export class DatabaseModule {
  static forService(serviceEnvPrefix: string): DynamicModule {
    return {
      module: DatabaseModule,
      imports: [
        TypeOrmModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (config: ConfigService) => ({
            type: 'postgres',
            host: config.get<string>('database.host'),
            port: config.get<number>('database.port'),
            username: config.get<string>('database.username'),
            password: config.get<string>('database.password'),
            database:
              config.get<string>(`${serviceEnvPrefix}_DB_NAME`) ??
              `${serviceEnvPrefix.toLowerCase()}_db`,
            autoLoadEntities: true,
            synchronize: config.get<string>('NODE_ENV') !== 'production',
          }),
        }),
      ],
      exports: [TypeOrmModule],
    };
  }
}
