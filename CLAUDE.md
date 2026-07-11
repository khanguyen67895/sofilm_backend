# SoFilm Backend — NestJS Microservices Monorepo

Backend for the SoFilm streaming platform (pairs with the Next.js frontend at
`../sofilm`). 11 independently-runnable services + 7 shared libraries in a
single Nest CLI monorepo (`apps/` + `libs/`, no Nx/Turborepo needed).

## Stack

- **NestJS 10** (Express platform), TypeScript strict-ish (`strictNullChecks`, `noImplicitAny: false`)
- **PostgreSQL + TypeORM** — *database per service*: each service that needs one owns its own logical Postgres database (same instance in dev, `synchronize: true` outside production — no migrations yet, see Known follow-ups)
- **Redis + ioredis** — cache, OTP storage, per-user recommendation cache
- **BullMQ** (`@nestjs/bullmq`) — async pipelines: video transcoding, notification delivery
- **Elasticsearch** — search-service's document store (movies indexed by title/actors/genres/tags/directors)
- **S3-compatible object storage** (MinIO in dev) via `@aws-sdk/client-s3` + presigned URLs — video-service never proxies file bytes itself
- **JWT** (access + refresh, separate secrets/expiry) — `libs/auth` provides shared *verification*; `apps/auth` is the only service that *issues* tokens
- **Swagger** on every service at `/docs` (gateway's own `/docs` documents the proxy; each service's own `/docs` is the authoritative source for its request/response shapes)

## Why an HTTP reverse-proxy gateway, not Nest microservice transports

The gateway (`apps/gateway`) is a thin **reverse proxy / BFF**, not a Nest
`@nestjs/microservices` TCP/Redis transport hub. It forwards each request's
*full original path* to whichever service owns its first path segment
(`apps/gateway/src/proxy/proxy-config.service.ts` is the routing table), over
plain HTTP via `@nestjs/axios`. Every service also runs its own independent
HTTP server (own Swagger, directly curl-able in dev) — the gateway is an
edge concern (rate limiting, CORS, one public entry point), not the only way
to reach a service. This was a deliberate simplicity trade-off over Nest's
RPC transports: one mental model (HTTP) end-to-end, easy to debug with curl,
easy to add a new service to (one line in the routing table).

**Auth is NOT re-checked at the gateway.** The gateway's catch-all route is
`@Public()` — it forwards the `Authorization` header through unchanged and
every downstream service independently verifies the JWT (they all trust the
same `JWT_ACCESS_SECRET`) and declares its own `@Public()`/`@Roles()` per
route. The gateway only adds rate limiting + logging.

## Directory Structure

```
apps/
├── gateway/         # Public entry point — HTTP reverse proxy, rate limiting, JWT passthrough
├── auth/            # Login/register/social/refresh/OTP/devices — issues JWTs (owns auth_db)
├── user/            # Profile/avatar/favorites/settings/notification-settings (owns user_db)
├── movie/            # Movies/series/seasons/episodes + catalog (genre/category/country/tag/actor/director/banner) (owns movie_db)
├── video/            # Upload (S3 presign) + video/quality/subtitle/audio metadata, enqueues transcode jobs (owns video_db)
├── transcoder/        # BullMQ WORKER, no HTTP — consumes video-transcode queue, runs the ffmpeg pipeline stub
├── search/             # Elasticsearch-backed search across movie/actor/genre/tag/director (no Postgres)
├── history/             # Watch progress / continue-watching / likes (owns history_db)
├── recommendation/       # Rule-based reco (pluggable collaborative/content-based/hybrid strategies), no Postgres
├── payment/               # Plans/coupons/invoices/payments/refunds + 5-provider strategy pattern (owns payment_db)
└── notification/           # Email/push/SMS/in-app, BullMQ-driven delivery (owns notification_db)

libs/
├── common/    # BaseEntity, PaginationQueryDto/paginate(), ApiResponseDto, HttpExceptionFilter,
│              # TransformInterceptor, LoggingInterceptor, CrudService<T>, slugify(), shared enums
├── config/    # ConfigModule (Joi-validated, namespaced: database/redis/jwt/s3/elasticsearch/mail/payment)
├── database/  # DatabaseModule.forService('X') → TypeOrmModule.forRootAsync using `${X}_DB_NAME`
├── redis/     # RedisModule (Global) + RedisService (get/set/getJson/setJson/del/ttl/incr)
├── queue/     # QueueModule.forRoot()/.registerQueues(...) (BullMQ), QUEUE_NAMES, job-name constants
├── auth/      # AuthLibModule, JwtAuthGuard, RolesGuard, @Public()/@Roles()/@CurrentUser(), JwtStrategy
└── logger/    # LoggerModule (Global, Winston via nest-winston)
```

## Ports & routing (gateway → service)

| Service        | Port | Gateway path prefixes                                  | Own DB           |
|----------------|------|----------------------------------------------------------|-------------------|
| gateway        | 3000 | (all — reverse proxy)                                     | —                 |
| auth           | 3001 | `/auth`                                                    | `auth_db`         |
| user           | 3002 | `/users`, `/favorites`, `/settings`                        | `user_db`         |
| movie          | 3003 | `/movies`, `/genres`, `/categories`, `/countries`, `/tags`, `/actors`, `/directors`, `/banners` | `movie_db` |
| video          | 3004 | `/videos`, `/shorts`                                       | `video_db`        |
| search         | 3005 | `/search`                                                  | — (Elasticsearch) |
| history        | 3006 | `/history`                                                 | `history_db`      |
| recommendation | 3007 | `/recommendations`                                         | — (stateless)     |
| payment        | 3008 | `/subscriptions`, `/payments`, `/coupons`                  | `payment_db`      |
| notification   | 3009 | `/notifications`                                           | `notification_db` |
| transcoder     | —    | (no HTTP — BullMQ worker only)                             | —                 |

`apps/gateway/src/proxy/proxy-config.service.ts` is the single source of
truth for this table — adding a service is one new entry there plus a
`*_SERVICE_URL` env var.

## Conventions

- **One `app.module.ts` shape everywhere**: `ConfigModule` (`@app/config`) → `LoggerModule` (`@app/logger`) → `RedisModule`/`DatabaseModule.forService('X')`/`QueueModule.forRoot()` as needed → `AuthLibModule` (`@app/auth`) → feature module(s). Global providers, in this order: `APP_GUARD JwtAuthGuard`, `APP_GUARD RolesGuard`, `APP_FILTER HttpExceptionFilter`, `APP_INTERCEPTOR LoggingInterceptor`, `APP_INTERCEPTOR TransformInterceptor`. Copy `apps/auth/src/app.module.ts` for any new service.
- **Every route is protected by default.** Add `@Public()` (from `@app/auth`) explicitly to opt out; add `@Roles('ADMIN', ...)` to require specific roles. `@CurrentUser()` / `@CurrentUser('sub')` reads the JWT payload.
- **Entities** live in `src/entities/*.entity.ts`, extend `BaseEntity` from `@app/common` (`id`/`createdAt`/`updatedAt`/`deletedAt`, soft-delete via `deletedAt`).
- **Simple lookup entities** (genre, category, country, tag, coupon, subscription plan, …) extend `CrudService<T>` from `@app/common` instead of hand-rolling find/create/update/remove.
- **Cross-service calls are plain HTTP**, never through the gateway: `HttpModule.register({timeout: ...})` from `@nestjs/axios` + `firstValueFrom` from `rxjs`, target URL from a `*_SERVICE_URL` env var (`ConfigService.get('MOVIE_SERVICE_URL')`, plain var, no namespace). `movie-service`'s `POST /movies/batch` is the standard way other services hydrate a list of movie ids into full movie objects.
- **No shared database access across services** — if service B needs to reference an id owned by service A, it stores that id as a plain string column, never a cross-database foreign key.
- Response shape: every controller response is wrapped by `TransformInterceptor` into `{ success, data, message?, timestamp }`; errors are normalized by `HttpExceptionFilter` into `{ success: false, statusCode, message, errors?, path, timestamp }`.

## Running locally

```bash
cp .env.example .env
npm install
npm run infra:up               # postgres, redis, elasticsearch, minio, mailhog (docker compose up -d)
npm run start:gateway          # and start:auth / start:movie / start:user / ... per service
```

Each service is independently runnable/curl-able on its own port with its
own `/docs` Swagger UI — you don't need the gateway (or every other service)
running to work on one of them, except for the cross-service HTTP calls
noted per-service below.

`npm run stack:up` builds a single shared image (`Dockerfile`) and runs
*every* service (`docker compose --profile apps up -d --build`) instead of
just the infra containers — useful for an end-to-end smoke test without
juggling 11 terminal tabs.

## CI/CD

Modeled directly on the sibling `sofin` project's pipeline — same shape, same
tools, adapted for this repo's npm/webpack/TypeORM stack instead of
pnpm/Nx/Prisma:

- **`Dockerfile`** — one image for the whole monorepo (multi-stage: `npm ci` + `npm run build:all`, which runs `nest build <app>` — webpack-bundled, see below — for all 11 apps; the runtime stage just copies `node_modules` + `dist` + `package.json`). `docker-compose.yml`/`docker-compose.prod.yml` reuse this single image per service, overriding only `command:`.
- **`nest-cli.json` sets `"webpack": true`** — this matters: without it, `nest build` uses raw `tsc`, and because every app's source cross-references `libs/*` via TS path aliases, `tsc` computes each app's `outDir` relative to the *workspace* root instead of the app's own `src/`, producing a nested `dist/apps/<name>/apps/<name>/src/main.js` instead of the clean `dist/apps/<name>/main.js` the Dockerfile/compose `command:`s expect. If a fresh `nest build` ever produces that nested path again, check this flag first.
- **`docker-compose.yml`** — local dev infra (`postgres`/`redis`/`elasticsearch`/`minio`/`mailhog`) always on; add `--profile apps` to also run all 11 services from the local image.
- **`docker-compose.prod.yml`** + **`Caddyfile`** — single-host production stack (self-hosted Postgres/Redis/ES/MinIO + all 11 apps + Caddy terminating TLS in front of the gateway only). See **[`DEPLOY.md`](./DEPLOY.md)** for the full runbook (secrets, first-time host setup, troubleshooting) — it's the sofilm-backend equivalent of `sofin/infra/DEPLOY.md`.
- **`.github/workflows/deploy.yml`** — three jobs: `test` (lint + typecheck + `build:all`, every push/PR) → `build` (Docker Buildx → push to ECR, `main`/manual only) → `deploy` (roll the EC2 host forward via `aws ssm send-command`, `main`/manual only). Needs 5 repo secrets: `AWS_REGION`, `ECR_REPOSITORY`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `EC2_INSTANCE_ID`.
- This repo has no AWS account/EC2 host/ECR repo wired up yet (also no `git init`/GitHub remote) — the pipeline is ready to go the moment those exist and the 5 secrets are set; until then `test` still runs and gates PRs on lint+typecheck+build.

## Known stubs / TODOs left on purpose (all commented in source)

These are the honest gaps in a scaffold this size — each is a clearly
marked, swap-in point, not a hidden shortcut:

- **Social login** (`apps/auth/src/auth/social-verifier.service.ts`) — Google/Facebook/Apple token verification is a dev-only stub (expects a JSON string, not a real provider token). Real integrations: `google-auth-library`, a Facebook Graph API call, `apple-signin-auth`.
- **OTP** (`apps/auth/src/auth/otp.service.ts`) — logs the code to the console instead of sending it; wire it to `notification-service` instead.
- **Internal service-to-service auth** — several endpoints that should only ever be called by another service, not an end user (`PATCH /users/me/subscription`, `PATCH /videos/:id/status`, `POST /search/index`, payment webhook handlers) are currently just `@Public()`/`@Roles('ADMIN')` with a `// TODO` comment. There's no mTLS/shared-secret/service-account story yet — add one before any of this is internet-facing.
- **Video pipeline** (`apps/transcoder`) — the ffmpeg pipeline logs each stage and returns placeholder HLS/thumbnail/subtitle URLs; it does not actually invoke ffmpeg end-to-end or upload real files. Real implementation needs an ffmpeg binary on the worker's PATH (or a dedicated container) and real S3 upload calls.
- **Payment providers** (`apps/payment/src/providers/*.ts`) — Stripe/PayPal/VNPay/MoMo/ZaloPay are all stubs (`createCheckout` returns a fake redirect URL, `verifyWebhook` doesn't do real signature verification). Real HMAC/webhook-signature verification is required before accepting real money.
- **Push/SMS** (`apps/notification/src/channels/{push,sms}.service.ts`) — log-only stubs; wire real FCM / Twilio calls.
- **Search indexing** (`apps/search`) — `POST /search/index` is a manual endpoint; movie-service should publish a `movie.upserted` event instead once there's an event bus.
- **Recommendation strategies** (`apps/recommendation/src/recommendation/strategies/*.ts`) — `CollaborativeFilteringStrategy`/`ContentBasedStrategy`/`HybridStrategy` are real extension points (the interface is meant to stay stable) but all currently share the same trending/genre-overlap heuristic — none of them do real ML yet.
- **No migrations** — `synchronize: true` outside production (`libs/database`). Fine for a scaffold; replace with TypeORM migrations before any real deployment.
- **No tests** — Jest is installed but no test suites exist yet.

## Verification performed this session

- `npx tsc` / `npx nest build <every app and lib>` — **all 11 apps + 7 libs compile cleanly, zero TypeScript errors.**
- Runtime: `gateway` was booted standalone and confirmed to fully wire up (`ConfigModule`→`LoggerModule`→`AuthLibModule`→`ThrottlerModule`→`ProxyModule`) and serve `/docs` with HTTP 200. `auth` and `movie` were booted and confirmed to reach `TypeOrmModule`'s connection-retry logic and get a real Postgres protocol-level response (rejected only on credentials, against a pre-existing local Postgres unrelated to this project — proving the DI graph and DB config wiring are correct end-to-end).
- **Not verified this session**: a full docker-compose-backed run with the project's own Postgres/Redis/Elasticsearch/MinIO (Docker Desktop's engine would not start in this environment), and runtime boot of the other 8 services. Re-run the steps under "Running locally" once Docker is available to close that gap — the build passing on every service is a strong signal, but it isn't the same as having actually inserted a row and served a live request end-to-end for anything beyond gateway/auth/movie.
