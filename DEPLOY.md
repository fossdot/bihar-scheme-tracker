# Deploying the Bihar Scheme Tracker (self-hosted)

No cloud required. Everything runs in containers on a box you control — a VPS, an office
server, or your own machine. Postgres (with `pgvector`) holds the data; the Next.js app serves it.

> **Live deployment:** https://yojana.bodhya.net — a DigitalOcean droplet (Ubuntu 24.04),
> behind Cloudflare (proxied, SSL mode "Full"), running `docker-compose.prod.yml` (see
> "Production: real domain + HTTPS" below).

## One command

```bash
docker compose up -d --build
```

Then open **http://localhost:3000** (or `http://<server-ip>:3000`).

On first start the database is created, the schema is migrated, and the **verified catalogue is
seeded automatically** — `deploy/initdb/01_schema.sql` then `deploy/initdb/02_seed_data.sql` run in
order on the empty data directory. No manual migrate/seed step.

### Set a real password (recommended)

The compose file reads two optional env vars (defaults in parentheses):

```bash
echo "POSTGRES_PASSWORD=$(openssl rand -hex 16)" >> .env   # DB password (bihar)
echo "APP_PORT=3000"                              >> .env   # host port      (3000)
docker compose up -d --build
```

`.env` is git-ignored. The app reads `DATABASE_URL` from compose; you don't set it by hand.

## Updating the data later

The seed runs **only on first init** (empty volume). To publish a refreshed catalogue:

```bash
# 1. regenerate the data dump from your working database (pg16 client):
pg_dump --data-only --disable-triggers --no-owner --no-privileges --column-inserts \
  "$DATABASE_URL" > deploy/initdb/02_seed_data.sql
# 2. reset the DB volume and bring it back up (DESTROYS existing container data):
docker compose down -v && docker compose up -d --build
```

If you changed the schema, also regenerate `01_schema.sql`:

```bash
{ echo "create extension if not exists vector;"; echo "create extension if not exists pg_trgm;"; \
  cat supabase/migrations/*.sql; } > deploy/initdb/01_schema.sql
```

## Production: real domain + HTTPS (behind Cloudflare)

This is how the live site runs. It adds a Caddy reverse proxy in front for HTTPS and keeps the
app internal. Use `docker-compose.prod.yml` instead of the base compose file.

```bash
# .env on the server:
POSTGRES_PASSWORD=<strong random value>
SITE_ADDRESS=yojana.bodhya.net          # your domain

docker compose -f docker-compose.prod.yml up -d --build
```

**DNS / Cloudflare:** add an `A` record for the subdomain → the server's IP. Keep it **Proxied
(orange cloud)** for caching + DDoS protection, and set **SSL/TLS mode to "Full"** in the
Cloudflare dashboard. Caddy serves a self-signed cert on the origin (`tls internal`); Cloudflare
presents the public browser-trusted cert. Open ports **80 + 443** on the firewall (`ufw allow 80,443/tcp`).

If you instead run **without** Cloudflare (direct / grey cloud), remove the `tls internal` line in
`deploy/caddy/Caddyfile` — Caddy will obtain a real Let's Encrypt cert automatically (needs 80+443
reachable publicly).

On a small (≤1 GB) droplet, add swap before building so `next build` doesn't run out of memory:
```bash
fallocate -l 3G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

## Putting it on the internet

The app listens on port 3000. For a public domain + HTTPS, front it with a reverse proxy
(Caddy or nginx) that terminates TLS and proxies to `127.0.0.1:3000`. Minimal Caddy example:

```
schemes.example.org {
    reverse_proxy 127.0.0.1:3000
}
```

## Backups & recovery

The verified registry is the project's crown jewel — back it up automatically.

**Set up (once, on the server):**
```bash
chmod +x /root/bihar-scheme-tracker/deploy/backup/backup.sh
( crontab -l 2>/dev/null; echo '7 2 * * * cd /root/bihar-scheme-tracker && ./deploy/backup/backup.sh >> /root/backups/backup.log 2>&1' ) | crontab -
```
`deploy/backup/backup.sh` writes a gzipped full dump to `/root/backups/bihar-<ts>.sql.gz` daily at
02:07 UTC, verifies it (non-empty + contains the `schemes` table), and keeps the newest 30.
For off-box safety, also copy `/root/backups` elsewhere (e.g. `rclone`/`rsync` to object storage).

**Restore:**
```bash
gunzip -c /root/backups/bihar-YYYYMMDD-HHMM.sql.gz | docker compose exec -T db psql -U bihar -d bihar_scheme_tracker
```
Test recovery periodically: restore into a throwaway DB and check row counts (`select count(*) from schemes`).

## Notes

- **Runtime needs only Postgres** — the finder uses full-text + trigram search. The Anthropic API
  is used only offline, when (re)generating embeddings/summaries during seeding, never at request time.
- **Logs:** `docker compose logs -f app`.
- **Local dev (no Docker)** is unchanged: a local Postgres + `.env.local` with `DATABASE_URL`,
  then `npm run dev`. Migrations in `supabase/migrations/` are applied with `psql`.
