import 'dotenv/config';
import { createServiceDataSource } from '@app/database';

export default createServiceDataSource('AUTH', {
  entities: [__dirname + '/entities/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
});
