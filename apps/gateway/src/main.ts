import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';
import { ProxyController } from './proxy/proxy.controller';

async function bootstrap() {
  process.env.SERVICE_NAME = 'gateway';
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));
  app.enableCors();

  const config = new DocumentBuilder()
    .setTitle('SoFilm — API Gateway')
    .setDescription(
      'Single public entry point for the SoFilm frontend. Routes are reverse-proxied to ' +
        "the owning microservice by the first path segment — see each service's own /docs " +
        '(auth, movie, user, video, search, history, recommendation, payment, notification) ' +
        'for the authoritative request/response shapes.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, config));

  // Registered as raw Express middleware, not a Nest route — see the
  // comment on ProxyController for why `@All('*')` doesn't work here.
  //
  // Nest's own body-parser is normally wired up inside app.listen() ->
  // init(), which runs AFTER this file's synchronous app.use() calls — so a
  // catch-all middleware added here would otherwise run before req.body is
  // ever populated, forwarding an empty body downstream. Register JSON/
  // urlencoded parsing ourselves, explicitly, ahead of the proxy catch-all.
  app.use(json());
  app.use(urlencoded({ extended: true }));

  const proxy = app.get(ProxyController);
  app.use((req: import('express').Request, res: import('express').Response) =>
    proxy.forward(req, res),
  );

  const port = process.env.GATEWAY_PORT ?? 3000;
  await app.listen(port);
  console.log(`🚪 gateway listening on :${port}`);
}
bootstrap();
