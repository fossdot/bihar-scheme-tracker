# Bihar Policy & Scheme Tracker

**Live: [yojana.bodhya.net](https://yojana.bodhya.net)**

A citizen-facing **scheme finder** and a **research catalogue** for Bihar (and relevant central)
government schemes & policies — backed by a source-verified registry with an honest, evidence-based
view of which schemes are *actually still running*.

> Wrong policy information is worse than no information.
> **Status is derived from evidence, never asserted — and no figure is ever fabricated.**

---

## What it does

- **Find schemes you qualify for.** Tell it who you are — occupation / life-situation, age, gender,
  social category, income, education, domicile — and see the schemes you likely qualify for, each
  with its real status, eligibility, benefit, and official apply link.
- **Research catalogue.** Browse schemes and policies, their evidence-derived status, budgets over
  time, and public-consultation drafts open for comment.
- **Honest status.** Three citizen buckets — **Active**, **Possibly active**, **Inactive** — over
  seven evidence-based internal statuses. Unverified-but-maybe-live schemes surface as "Possibly
  active" rather than being hidden, so incomplete data never denies someone help.
- **Bilingual.** English + हिन्दी throughout, with the language in the URL (`/en`, `/hi`) and
  reciprocal `hreflang`.

## Public API

Read-only, CORS-open, bilingual JSON. Discovery at **[`/api/v1`](https://yojana.bodhya.net/api/v1)**.

| Endpoint | Returns |
| --- | --- |
| `GET /api/v1` | API discovery + record counts |
| `GET /api/v1/schemes` | Filterable scheme list (`?q=`, `?category=`, `?persona=`, `?age=`, `?income=`, …) |
| `GET /api/v1/schemes/{id}` | Full scheme detail — eligibility, benefit, budget, metrics, sources |
| `GET /api/v1/policies` | Policy list (`?q=`) |
| `GET /api/v1/policies/{id}` | Full policy detail |

Every record carries a `source_url` + `last_verified`; figures carry a provenance. Data is never fabricated.

## Tech

- **Next.js 14** (App Router) + **Tailwind**
- **Local PostgreSQL** (`pgvector` + `pg_trgm`) via **node-postgres** — full-text + semantic search,
  no cloud database
- Self-hosted via **Docker Compose** behind Cloudflare

## Local development

```bash
git clone https://github.com/fossdot/bihar-scheme-tracker
cd bihar-scheme-tracker
npm install
cp .env.local.example .env.local      # set DATABASE_URL (+ ANTHROPIC_API_KEY, ADMIN_KEY)

# Create a Postgres database, then load the schema + the catalogue data:
psql "$DATABASE_URL" -f deploy/initdb/01_schema.sql
npm run data:load                     # loads data/ (YAML) into the DB

npm run dev                           # → http://localhost:3000
```

## Data & contributing

The catalogue lives as per-entity **YAML under `data/`** — the source of truth, not the seed
scripts. Every record links to an official source and its status is derived from evidence. Run
`npm run data:validate` before sending a change. See **[CONTRIBUTING.md](CONTRIBUTING.md)** for the
full workflow (report an error, suggest a scheme, or open a data PR).

## Deployment

No cloud required — everything runs in containers on a box you control. See **[DEPLOY.md](DEPLOY.md)**.

## License

This work is licensed under the **Creative Commons Attribution-ShareAlike 4.0 International License
(CC BY-SA 4.0)** — see **[LICENSE](LICENSE)**. You're free to share and adapt it for any purpose,
as long as you give attribution and license your contributions under the same terms.

## Credits

A project by **Vishal Arya** under **[Bodhya](https://bodhya.net)**, with
[FOSS United](https://fossunited.org). Data sourced from official Government of Bihar and
Government of India publications.
