import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import databaseConfig from './namespaces/database.config';
import redisConfig from './namespaces/redis.config';
import jwtConfig from './namespaces/jwt.config';
import s3Config from './namespaces/s3.config';
import elasticsearchConfig from './namespaces/elasticsearch.config';
import mailConfig from './namespaces/mail.config';
import paymentConfig from './namespaces/payment.config';
import { validationSchema } from './validation.schema';

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
      load: [
        databaseConfig,
        redisConfig,
        jwtConfig,
        s3Config,
        elasticsearchConfig,
        mailConfig,
        paymentConfig,
      ],
      validationSchema,
      validationOptions: { abortEarly: false },
    }),
  ],
})
export class ConfigModule {}
