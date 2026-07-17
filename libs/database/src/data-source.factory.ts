import { DataSource, DataSourceOptions } from 'typeorm';

/**
 * Builds a plain TypeORM `DataSource` for the CLI (`migration:generate`/
 * `migration:run`), reading the same env vars as `DatabaseModule.forService()`
 * but outside of Nest's DI — the CLI can't use `autoLoadEntities`, it needs an
 * explicit `entities`/`migrations` glob.
 */
export function createServiceDataSource(
  serviceEnvPrefix: string,
  options: Pick<DataSourceOptions, 'entities' | 'migrations'>,
): DataSource {
  return new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    username: process.env.DB_USERNAME ?? 'sofilm',
    password: process.env.DB_PASSWORD ?? 'sofilm',
    database: process.env[`${serviceEnvPrefix}_DB_NAME`] ?? `${serviceEnvPrefix.toLowerCase()}_db`,
    synchronize: false,
    ...options,
  });
}
