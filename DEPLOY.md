# Deploy runbook — build, push, release

How to ship a new version of the app to the single-EC2 host once the AWS
infrastructure exists (VPC, EC2, ECR, Elastic IP, an IAM role with SSM +
ECR-pull permissions attached to the instance). For first-time provisioning of
those pieces, use the AWS CDK app in [`infra/cdk`](./infra/cdk/README.md) — it
prints the values for the table below (`InstanceId`, `EcrUri`, `PublicIp`) as
deploy outputs, so you don't have to hunt for them in the Console.

The host runs the whole stack from [`docker-compose.prod.yml`](./docker-compose.prod.yml):
all 11 NestJS apps + self-hosted Postgres, Redis, Elasticsearch, and a
Caddy reverse proxy. One image (`sofilm-app`) is built from this repo and
reused by every app container; compose overrides the `command:` per service.
Object storage is real AWS S3, not self-hosted — provision the bucket and a
scoped IAM user out-of-band before first boot (see `S3_*`/`CDN_BASE_URL` below).

---

## Account / host reference

Fill this in once the AWS side exists — it's intentionally blank in a fresh checkout:

| Thing | Value |
|---|---|
| AWS account | `<fill in>` |
| Region | `<fill in>` (e.g. `ap-southeast-1`) |
| ECR registry | `<account>.dkr.ecr.<region>.amazonaws.com` |
| Image repo | `sofilm-app` (tag `latest`) |
| EC2 instance | `<fill in>` (`i-xxxxxxxx`) |
| Elastic IP | `<fill in>` |
| Instance type | pick amd64/x86_64 unless you adjust the build platform below |
| App dir on host | `/opt/sofilm-backend` |
| Env file on host | `/opt/sofilm-backend/.env.prod` (not in git — holds secrets) |

Connect to the host via SSM (no SSH key needed):

```bash
aws ssm start-session --target <instance-id> --region <region>
```

GitHub Actions secrets required for `.github/workflows/deploy.yml` (Settings →
Secrets and variables → Actions): `AWS_REGION`, `ECR_REPOSITORY`,
`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `EC2_INSTANCE_ID`.

### Where to find these values (AWS Console)

| Value | Where |
|---|---|
| AWS account ID | Top-right account menu → "Account" (12-digit number), or `aws sts get-caller-identity` |
| Region | Top-right region dropdown, e.g. "Asia Pacific (Singapore) ap-southeast-1" — the part in parens is what goes in config |
| EC2 instance ID | EC2 Console → Instances → your instance → `i-0123456789abcdef0` in the "Instance ID" column |
| Elastic IP | EC2 Console → Network & Security → Elastic IPs (allocate + associate one if you don't have one yet — without it, a stopped/restarted instance gets a new public IP and breaks DNS/bookmarks) |
| Instance architecture | EC2 Console → Instances → your instance → "Platform details"/"Architecture" column — confirms amd64 (x86_64) vs arm64 (Graviton) so you build for the right platform (gotcha #1 below) |

### Provisioning checklist (do this once, before the first deploy)

Steps 1–4 are all handled by `cd infra/cdk && npm install && npx cdk deploy`
(see [`infra/cdk/README.md`](./infra/cdk/README.md)) — it creates the VPC, EC2
instance (with the SSM + ECR-pull IAM role attached), Elastic IP, ECR repo,
installs Docker on boot, and clones this repo to `/opt/sofilm-backend`. Steps
5–6 are still manual (they're GitHub-side, not AWS-side):

1. ~~ECR repo~~ — created by `cdk deploy` (`sofilm-app`, the `EcrUri` output). This is the value for the `ECR_REPOSITORY` secret.
2. ~~IAM role on the EC2 instance~~ — attached by `cdk deploy` (`AmazonSSMManagedInstanceCore` + `AmazonEC2ContainerRegistryReadOnly`).
3. ~~Docker on the host~~ — installed by the instance's user-data on first boot.
4. ~~App directory on the host~~ — `/opt/sofilm-backend` is `git clone`d by user-data; you still need to create `.env.prod` there yourself (see "First-time / fresh-host configuration" below — it's git-ignored on purpose).
5. **IAM user/keys for GitHub Actions** — create an IAM user (or better, set up OIDC federation later) with ECR push + SSM send-command permissions, generate an access key, and put it in the `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY` GitHub secrets. Keep this separate from your own personal AWS credentials.
6. **Push to GitHub + set the 5 secrets** — the CI/CD pipeline (`.github/workflows/deploy.yml`, triggers on push to `main`) only runs once the repo is on GitHub with all 5 secrets set (Settings → Secrets and variables → Actions).

---

## ⚠️ Critical gotchas (read once)

1. **Build for `linux/amd64`.** If the host is a standard x86_64 instance and
   you build locally on Apple Silicon, a plain `docker build` produces an
   **arm64** image that fails on the host with "exec format error". Use
   `docker buildx build --platform linux/amd64 ... --push` — or just let CI
   build it (`ubuntu-latest` runners are amd64 already).
2. **The host runs whatever image is pulled, not your working tree.** CI
   builds and pushes the image; the host only pulls it. Commit and push
   `Dockerfile` / `docker-compose.prod.yml` / `Caddyfile` changes — local
   edits do nothing until they're built into an image.
3. **`.env.prod` values take no inline comments.** A trailing `# comment` (or
   a stray non-ASCII char) on a value line silently breaks that variable.
   Keep comments on their own lines.
4. **No migrations yet.** `libs/database`'s `DatabaseModule.forService()` sets
   `synchronize: true` outside `NODE_ENV=production` only — in production
   TypeORM will NOT auto-create tables. Either run a one-off migration step
   before first boot, or temporarily allow `synchronize` in prod for a first
   deploy (fine for a fresh scaffold, not for a database with real data —
   see the "No migrations" line in `CLAUDE.md`).
5. **Passwords go into connection strings/URLs.** `POSTGRES_PASSWORD` /
   `S3_SECRET_KEY` get interpolated into env vars consumed as connection
   config. Use URL-safe values (`openssl rand -hex 24`) — avoid `$ @ : / # ? %`.

---

## Routine release (new app version)

Normally this is just "push to `main`" — `.github/workflows/deploy.yml` builds,
pushes to ECR, and rolls the EC2 host forward automatically. To do it by hand:

```bash
ECR=<account>.dkr.ecr.<region>.amazonaws.com

# 1. Log in to ECR (token lasts ~12h)
aws ecr get-login-password --region <region> \
  | docker login --username AWS --password-stdin $ECR

# 2. Build for amd64 and push
docker buildx build --platform linux/amd64 \
  -t $ECR/sofilm-app:latest \
  -f Dockerfile --push .
```

Then on the host (via SSM session, or `aws ssm send-command`):

```bash
cd /opt/sofilm-backend
aws ecr get-login-password --region <region> \
  | docker login --username AWS --password-stdin $ECR

docker compose -f docker-compose.prod.yml --env-file .env.prod pull
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d
docker compose -f docker-compose.prod.yml --env-file .env.prod ps
```

---

## First-time / fresh-host configuration

### 1. `.env.prod`

Create `/opt/sofilm-backend/.env.prod`. Generate secrets:

```bash
openssl rand -hex 24   # POSTGRES_PASSWORD
openssl rand -hex 32   # JWT_ACCESS_SECRET
openssl rand -hex 32   # JWT_REFRESH_SECRET
```

`S3_ACCESS_KEY`/`S3_SECRET_KEY` are real AWS credentials, not generated —
create a scoped IAM user (`s3:GetObject`/`s3:PutObject`/`s3:PutBucketCors` on
just the one bucket) and use its access key pair.

```bash
POSTGRES_USER=sofilm
POSTGRES_PASSWORD=<hex>
S3_ACCESS_KEY=<IAM access key id>
S3_SECRET_KEY=<IAM secret access key>
S3_BUCKET=sofilm-media
CDN_BASE_URL=https://media.example.com   # your S3/CloudFront public URL
JWT_ACCESS_SECRET=<hex>
JWT_REFRESH_SECRET=<hex>

# No domain yet — IP-only smoke test (see "IP-only vs domain" below for the
# matching Caddyfile change this requires).
API_DOMAIN=<your Elastic IP, e.g. 3.0.33.20>

APP_IMAGE=<account>.dkr.ecr.<region>.amazonaws.com/sofilm-app:latest
```

Also copy `docker-compose.prod.yml` and `Caddyfile` onto the host at
`/opt/sofilm-backend/` (git clone the repo there, or scp just those two files
— either way, keep them in sync with what's in git).

### 2. IP-only vs domain (Caddy)

The reverse proxy address comes from `API_DOMAIN`. [`Caddyfile`](./Caddyfile)
uses `{$API_DOMAIN}` with no scheme — Caddy auto-provisions a Let's Encrypt
cert and serves HTTPS whenever `API_DOMAIN` is a real domain (point an A
record at the Elastic IP first).

- **Real domain (required for any HTTPS frontend):** the Next.js frontend is
  presumably served over HTTPS too. If `NEXT_PUBLIC_API_URL` points the
  browser at a plain-HTTP API, the browser blocks every request as mixed
  content — the API must be HTTPS too.
- **Raw IP (smoke test only, no real frontend traffic — this is you right now):**
  edit `Caddyfile` on the host to add an explicit `http://` scheme, since
  Let's Encrypt cannot issue a certificate for a bare IP and Caddy would
  otherwise hang retrying:

  ```caddyfile
  http://{$API_DOMAIN} {
  	encode gzip
  	reverse_proxy gateway:3000
  }
  ```

  With `API_DOMAIN=3.0.33.20` (your Elastic IP) in `.env.prod`, this serves
  plain HTTP on port 80 at `http://3.0.33.20/...`. No HTTPS in this mode —
  don't point a real frontend at it, it's just for confirming the stack boots
  and the gateway responds. Switch back to the schemeless `{$API_DOMAIN}`
  block (see `Caddyfile` in git) once you have a real domain pointed at the IP.

---

## Verify

```bash
curl -s -o /dev/null -w '%{http_code}\n' http://<host>/health         # 200 (gateway)
curl -s http://<host>/docs                                             # gateway Swagger UI
```

All 16 containers should be `Up`; `postgres` shows `(healthy)`.

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `pull access denied for sofilm-app` | wrong account in URI, or not logged in | confirm the account id; re-run `docker login` against ECR |
| compose tries to **build** instead of pull | `APP_IMAGE` empty → falls back to `sofilm-app:latest` default | check `--env-file .env.prod`; ensure `APP_IMAGE` has no trailing comment; confirm with `docker compose … config \| grep image:` |
| `exec format error` on app containers | image built for the wrong CPU architecture | rebuild with `--platform linux/amd64` |
| A service crash-loops with a TypeORM connection error | Postgres not up yet, or wrong `${X}_DB_NAME` | check `docker compose logs postgres`; confirm the database name env vars match `docker/postgres/init-multiple-dbs.sh`'s list |
| `error while interpolating … POSTGRES_PASSWORD` | `$` (or other special char) in a password | regenerate with `openssl rand -hex 24`, or escape `$` as `$$` |
| Caddy won't start | `{$API_DOMAIN}` is empty | set `API_DOMAIN` in `.env.prod` |

### Inspecting on the host

```bash
cd /opt/sofilm-backend
C="docker compose -f docker-compose.prod.yml --env-file .env.prod"
$C ps                       # statuses
$C logs --tail=50 auth      # one service's logs
$C config | grep image:     # what image each service resolves to
```

---

## TODO / known debt

- **No infra-provisioning script** (CDK/Terraform) — the VPC/EC2/ECR/IAM role
  described in the reference table above have to be created by hand today.
- **No migrations** — see gotcha #4. Add TypeORM migrations before this holds
  real user data.
- **Resource headroom** — 11 app containers + Postgres + Redis + Elasticsearch
  + Caddy on one box needs real memory (Elasticsearch alone wants ~1-2 GB);
  size the instance accordingly and watch for OOM.
