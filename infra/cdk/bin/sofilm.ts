#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { SofilmStack } from '../lib/sofilm-stack';

const app = new cdk.App();

// Account/region resolve from the standard CDK_DEFAULT_* env (your AWS CLI
// profile) so this stays env-driven — no hard-coded account or region.
new SofilmStack(app, 'SofilmStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  description:
    'Single EC2 host running the SoFilm docker-compose stack (11 NestJS apps, Postgres, Redis, Elasticsearch, MinIO, Caddy).',
});
