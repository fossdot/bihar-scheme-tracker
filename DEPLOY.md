# Deploying the Bihar Scheme Tracker (self-hosted)

No cloud required. Everything runs in two containers on a box you control — a VPS, an office
server, or your own machine. Postgres (with `pgvector`) holds the data; the Next.js app serves it.

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

## Putting it on the internet

The app listens on port 3000. For a public domain + HTTPS, front it with a reverse proxy
(Caddy or nginx) that terminates TLS and proxies to `127.0.0.1:3000`. Minimal Caddy example:

```
schemes.example.org {
    reverse_proxy 127.0.0.1:3000
}
```

## Notes

- **Runtime needs only Postgres** — the finder uses full-text + trigram search. The Anthropic API
  is used only offline, when (re)generating embeddings/summaries during seeding, never at request time.
- **Backups:** `docker compose exec db pg_dump -U bihar bihar_scheme_tracker > backup.sql`.
- **Logs:** `docker compose logs -f app`.
- **Local dev (no Docker)** is unchanged: a local Postgres + `.env.local` with `DATABASE_URL`,
  then `npm run dev`. Migrations in `supabase/migrations/` are applied with `psql`.
