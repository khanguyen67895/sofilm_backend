import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  DB_HOST: Joi.string().default('localhost'),
  DB_PORT: Joi.number().default(5432),
  DB_USERNAME: Joi.string().default('sofilm'),
  DB_PASSWORD: Joi.string().default('sofilm'),
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),
  JWT_ACCESS_SECRET: Joi.string().default('change-me-access-secret'),
  JWT_REFRESH_SECRET: Joi.string().default('change-me-refresh-secret'),
}).unknown(true);
