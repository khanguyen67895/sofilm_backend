# Provisioning AWS infra for SoFilm (single EC2 + docker-compose)

Creates the AWS side referenced in [`../../DEPLOY.md`](../../DEPLOY.md)'s
"Account / host reference" table — VPC, EC2 instance, Elastic IP, security
group, SSM role, ECR repo — with **AWS CDK (TypeScript)**. This mirrors the
sibling `sofin` project's `infra/cdk`, adapted for SoFilm's heavier stack
(11 NestJS apps + Elasticsearch, vs sofin's 5 services). Object storage is
real AWS S3, same as `sofin` — provisioned/managed out-of-band, not by this stack.

```
                Internet
                   │  :80/:443
            ┌──────▼──────┐
            │    Caddy     │  API_DOMAIN → gateway:3000
            └──────┬──────┘
   gateway · auth · user · movie · video · search · history
   recommendation · payment · notification · transcoder
                   │
          postgres · redis · elasticsearch   (named volumes on EBS)
                    ── all on ONE EC2 host ──
                          + real AWS S3
```

Unlike `sofin`'s host (which builds the image on-box on first boot), this
host **only ever pulls** a prebuilt image — `.github/workflows/deploy.yml`
builds and pushes to ECR on every push to `master`. That's why the default
instance size here is smaller than you might expect for an 11-service stack:
you're sizing for *runtime*, not *build*, headroom.

## Prerequisites

- AWS CLI configured (`aws configure`) with credentials for the target account.
- Node.js 20+ (for the CDK CLI). The host itself needs nothing pre-installed —
  user-data installs Docker + Compose.
- One-time per account/region: `npx cdk bootstrap`.

## 1 · Provision the host

```bash
cd infra/cdk
npm install
npx cdk bootstrap            # first time only, per account/region
npx cdk deploy
```

Useful context overrides (`-c key=value`):

| Key | Default | Purpose |
|---|---|---|
| `instanceType` | `t3.medium` | 4 GB RAM + 6 GB swap. Elasticsearch + 11 Node processes want real memory — bump to `t3.large` (8 GB) if you see OOM kills (`dmesg \| grep -i kill` on the host). |
| `volumeSize` | `40` | Root EBS GB (ES index data + Docker images add up fast). |
| `sshCidr` | _(none)_ | Open `:22` to this CIDR, e.g. `-c sshCidr=1.2.3.4/32`. Omit to use SSM only. |
| `keyName` | _(none)_ | Existing EC2 key pair name (only if you set `sshCidr`). |
| `repoUrl` | this repo on GitHub | Git repo cloned to `/opt/sofilm-backend` on boot. |

Example for a beefier box:

```bash
npx cdk deploy -c instanceType=t3.large -c volumeSize=60
```

CDK prints outputs: **`PublicIp`** (Elastic IP), **`InstanceId`**, **`EcrUri`**,
and **`SsmConnect`** (a ready-to-run shell command). Copy `InstanceId` and the
`sofilm-app` repo name straight into the GitHub Actions secrets below.

## 2 · Wire up GitHub Actions secrets

`.github/workflows/deploy.yml` needs these (Settings → Secrets and variables → Actions):

| Secret | Value |
|---|---|
| `AWS_REGION` | region you deployed to, e.g. `ap-southeast-1` |
| `ECR_REPOSITORY` | `sofilm-app` |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | a **separate** IAM user/key with ECR push + `ssm:SendCommand`/`ssm:GetCommandInvocation` on this instance — not your personal credentials |
| `EC2_INSTANCE_ID` | the `InstanceId` output above |

## 3 · DNS

Point an A record at the **Elastic IP** (`PublicIp` output):

```
api.example.com → <PublicIp>
```

Caddy fetches a Let's Encrypt certificate automatically once DNS resolves
(see `Caddyfile` / `DEPLOY.md` "IP-only vs domain" for a no-domain smoke test).

## 4 · Configure secrets & first boot

Connect to the host (no SSH key required):

```bash
aws ssm start-session --target <InstanceId>     # from the SsmConnect output
```

On the host, follow [`../../DEPLOY.md`](../../DEPLOY.md) → "First-time / fresh-host
configuration" to create `.env.prod`, then either wait for the next push to
`master` to deploy automatically, or run the "Routine release" steps by hand
for the very first image.

## Operations

- **Logs:** `docker compose -f docker-compose.prod.yml logs -f <service>`
- **Redeploy:** push to `master` (CI handles build → push → SSM deploy), or
  see `DEPLOY.md`'s manual steps.
- **Tear down infra:** `cd infra/cdk && npx cdk destroy` (deletes the instance,
  EIP, VPC, and the EBS volume — **back up the DB first** if it matters; the
  ECR repo itself is retained unless you also remove it by hand).

## Notes & caveats

- **Self-hosted data:** Postgres/Redis/Elasticsearch run as containers with
  named volumes on the EBS root disk — fine for staging/demo. Object storage
  is already real S3 (see `../../DEPLOY.md`), not self-hosted. For
  production-grade durability on the rest, move Postgres to **RDS** and
  Elasticsearch to **Amazon OpenSearch** (the compose env vars already point
  at hostnames/endpoints, so it's mostly a URL swap).
- **Security:** only 80/443 are public; shell access is via SSM (no inbound
  SSH unless you set `sshCidr`). Secrets live only in `.env.prod` on the host,
  which is git-ignored.
- **Single host = no HA.** One instance, no autoscaling. Good for cost; step
  up to ECS/EKS when you need redundancy.
