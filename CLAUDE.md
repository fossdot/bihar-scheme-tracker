# Bihar Policy & Scheme Tracker

A citizen-facing **scheme finder** for Bihar: help an individual quickly discover which government
schemes benefit *them*, based on who they are. Backed by a source-verified registry of Bihar
**policies** and **schemes** with an honest, evidence-based view of which ones are actually still
running.

This file is the source of truth for project decisions. Follow it.

---

## Primary objective

This is a **finder, not just a registry**. A citizen should be able to: say who they are
(occupation / life-situation, age, gender, social category, income, education, domicile) → see the
schemes they likely qualify for → each with its real status, eligibility, benefit, and official
source / apply links. Eligibility is **structured and filterable**; status tells them whether it's
worth applying.

**Never hide potentially-live help.** Schemes whose status is `unknown` or `dormant` surface as
"Possibly active" (not hidden) — an unverified scheme may well be running, and incomplete data must
not deny someone live help. Only definitively-ended schemes (`lapsed` / `superseded` / `subsumed`)
are excluded from the default view (opt-in to see them).

---

## Core principle

The hard, valuable part of this project is **status determination**, not the UI.
Governments rarely announce that a scheme is dead — it just loses its budget line or gets folded
into a successor. So:

- **Status is derived from evidence, never asserted.** The strongest signal is the budget
  allocation across years.
- **Every fact links back to a source** (`source_url`) and carries a `last_verified_date`.
- **The LLM extracts, translates, and summarises — it never adjudicates status or truth.**
  Status comes from budget/notification data, not from the model's memory.

Wrong policy information is worse than no information. Default to "unknown" over a confident guess.

---

## Two distinct entity types

| Policy | Scheme |
|---|---|
| Framework document with a validity window | Operational program with beneficiaries + budget |
| e.g. Bihar IT Policy 2024 (period 09.01.24–08.12.29) | e.g. Student Credit Card, Kushal Yuva Program |
| Status from validity window + successor | Status from budget line presence |
| Fields: `policy_period`, `superseded_by` | Fields: `budget_allocations`, `eligibility`, `application_portal_url` |

---

## Stack

- **Next.js 14** (App Router) + **Tailwind**
- **Local Postgres** (self-hosted, no cloud) accessed directly via **node-postgres (`pg`)** —
  full-text search via `tsvector`, semantic search via `pgvector`. (Switched from Supabase to a
  direct local Postgres connection — no PostgREST/Supabase API layer; data model unchanged.)
- **Hindi-first UI** option (bilingual `_en` / `_hi` fields throughout)
- Embeddings + summaries via the Anthropic API; store embeddings in the `embedding` column

### Design system (tokens in `tailwind.config.ts`)

Minimal, clean, flat. **Black-and-white base**: near-black ink `#111111` on white / soft
off-white `#FAFAFA`, generous whitespace, hairline `#E5E5E5` borders & dividers, modest 6px
radius, **no shadows or gradients**. **FOSS United green `#278F5E` is the single accent** —
used sparingly for primary buttons, links, and active/selected states, *never* as a decorative
background fill. Semantic: red `#DC2626` (destructive/errors), amber `#B45309` (warnings).
**System sans-serif** type; hierarchy comes from weight + size, **not colour**. Status renders
as a quiet colour dot + text label (so it survives greyscale / colour-blindness). Dense but
legible tables. UI copy is plain and direct.

---

## MVP — build ONE complete vertical slice first

Do **not** attempt full coverage. Build the entire pipeline (schema → seed → status logic →
search → detail page) for just the **Saat Nischay youth/employment cluster**, then expand.

Seed entities (verify each against its `source_url`; figures below are starting points, not gospel):

1. **Bihar Student Credit Card Scheme** — education loan up to ₹4 lakh for 12th-pass students
   pursuing higher education. Launched 2 Oct 2016. Category: employment/education.
2. **Mukhyamantri Nishchay Swayam Sahayata Bhatta (MNSSBY)** — ₹1,000/month for up to 2 years
   to unemployed youth aged 20–25. Launched 2 Oct 2016.
3. **Kushal Yuva Program (KYP)** — employability/computer/communication training, ages 15–25.

Easy follow-on add: **Mukhyamantri Kanya Utthan Yojana** (education incentive for girls,
`medhasoft.bihar.gov.in`).

After the slice works end to end: add education schemes → add industry/IT policies → scale breadth
→ add the recurring year-over-year budget-tracking job.

---

## Data model (turn into a Supabase migration)

```sql
create extension if not exists vector;

create type scheme_status as enum (
  'active', 'likely_active', 'dormant', 'subsumed', 'superseded', 'lapsed', 'unknown'
);

create table departments (
  id           uuid primary key default gen_random_uuid(),
  name_en      text not null,
  name_hi      text,
  website      text
);

create table policies (
  id              uuid primary key default gen_random_uuid(),
  name_en         text not null,
  name_hi         text,
  department_id   uuid references departments(id),
  summary_en      text,
  summary_hi      text,
  period_start    date,
  period_end      date,
  status          scheme_status not null default 'unknown',
  superseded_by   uuid references policies(id),
  source_url      text not null,
  last_verified   date,
  created_at      timestamptz default now()
);

create table schemes (
  id                   uuid primary key default gen_random_uuid(),
  name_en              text not null,
  name_hi              text,
  department_id        uuid references departments(id),
  categories           text[] not null default '{}',  -- subset of 10 sectors (CHECK <@ allowed); GIN
  launch_date          date,
  objective_en         text,
  objective_hi         text,
  eligibility_en       text,
  eligibility_hi       text,
  benefit_type         text,          -- e.g. cash transfer, loan, training, subsidy
  benefit_detail       text,
  target_beneficiary   text,
  -- structured, filterable eligibility (free-text eligibility_en/_hi kept for display) --
  personas             text[] not null default '{}',  -- occupation/life-situation only (CHECK <@ allowed); GIN
  education_levels     text[] not null default '{}',  -- none/primary/secondary/senior_secondary/iti_diploma/graduate/postgraduate; GIN
  gender_eligibility   text not null default 'any' check (gender_eligibility in ('any','female','male','transgender')),
  social_categories    text[] not null default '{}',  -- sc/st/ebc/bc/general/minority (CHECK <@ allowed); GIN
  min_age              int,
  max_age              int,            -- check (min_age <= max_age)
  income_ceiling       numeric,        -- annual ₹; null = no income bar
  requires_bpl         boolean not null default false,  -- card-based; CHECK: never set together with income_ceiling
  domicile             text not null default 'bihar' check (domicile in ('bihar','any')),
  is_for_disabled      boolean not null default false,
  is_for_startups      boolean not null default false,
  land_ownership       text check (land_ownership in ('raiyat','non_raiyat','any')),  -- agriculture only; null = N/A
  successor_scheme_id  uuid references schemes(id),     -- subsumed/superseded → point citizen onward
  application_portal_url text,
  status               scheme_status not null default 'unknown',
  status_evidence      text,          -- WHY this status: what was checked
  last_budget_year     text,          -- e.g. '2026-27'
  last_notification_date date,
  source_url           text not null,
  last_verified        date,
  embedding            vector(1536),
  created_at           timestamptz default now()
);

create table budget_allocations (
  id            uuid primary key default gen_random_uuid(),
  scheme_id     uuid references schemes(id) on delete cascade,
  fiscal_year   text not null,         -- '2025-26'
  allocated_cr  numeric,               -- ₹ crore, budget estimate
  revised_cr    numeric,               -- revised estimate
  source_url    text not null
);

-- full-text search
alter table schemes add column search_tsv tsvector
  generated always as (
    to_tsvector('simple',
      coalesce(name_en,'') || ' ' || coalesce(name_hi,'') || ' ' ||
      coalesce(objective_en,'') || ' ' || coalesce(eligibility_en,''))
  ) stored;
create index schemes_search_idx on schemes using gin (search_tsv);
create index schemes_embedding_idx on schemes using ivfflat (embedding vector_cosine_ops);
-- structured-eligibility filter indexes (array containment):
create index schemes_personas_idx         on schemes using gin (personas);
create index schemes_education_levels_idx  on schemes using gin (education_levels);
create index schemes_social_categories_idx on schemes using gin (social_categories);
create index schemes_categories_idx        on schemes using gin (categories);
-- fuzzy search (fuzzy_search migration): pg_trgm + generated search_text + gin_trgm_ops index
```

---

## Research metrics & data provenance (`scheme_metrics`)

Research mode (for think tanks / policymakers / economists) needs more than the registry:
beneficiary counts, budget/disbursement over time, district distribution, demographics. These
live in `scheme_metrics` (migration `20260619000000`) — a provenance-aware time series:
`dimension` (budget | beneficiaries | district | demographics | outcomes), `fiscal_year`,
`label`, `value`, `unit`, and **`provenance`** (`published` | `reported` | `rti_received` |
`rti_filed` | `rti_needed` | `estimated`) + `source_url`.

**The no-fabrication rule extends here, hard.** Every figure carries its provenance + source;
nothing is estimated for a headline. Where Bihar publishes nothing, store a dimension-level row
with `value = NULL` and `provenance = 'rti_needed'` — the page then shows "RTI needed" (the data
request *is* the evidence trail), never a plausible-looking fake. The scheme page's "Data &
impact" section renders this.

**Sourcing reality:** much granular data (district/demographic splits) isn't published and comes
via **RTI** — slow, per-scheme, document-form. Headline budget/beneficiary counts for marquee
schemes are often public (no RTI). Division of labour: the maintainer files RTIs; the assistant
drafts the applications, mines public sources first, and ingests replies (extract → structure →
translate → load with the RTI reference as citation).

## Policies & public consultation

Policies are a first-class browsable entity (their own `/policies` catalogue + detail page, same
visual standard as schemes). Beyond the base table, `policies` carries sector `categories`,
`document_url`, and **public-consultation** fields (`is_draft`, `consultation_url`,
`consultation_start/end`, `how_to_comment_*`) so drafts open for comments surface prominently with
"how to comment" guidance. Display status is **derived** (`lib/policy.ts`): open / draft_closed /
in_force / lapsed / superseded — never asserted. Consultation deadlines we can't confirm are left
null and shown as "verify at source" rather than invented. Research mode (a "Data & impact" panel)
is present on policies too, honest-empty until impact data is sourced.

## Status taxonomy (what each value means)

- **active** — current-FY budget line and/or recent notification/disbursement
- **likely_active** — portal accepts applications, no recent budget confirmation
- **dormant** — no allocation for 1–2 years, no formal closure
- **subsumed** — folded into another scheme (set the link)
- **superseded** — replaced by a newer policy / past validity window
- **lapsed** — formally ended
- **unknown** — couldn't establish; record what was checked in `status_evidence`

Always populate `status_evidence`, `last_budget_year`, and `last_notification_date` to justify it.

### Citizen-facing status buckets (the finder's coarse filter)

The 7 internal statuses collapse into 3 buckets for citizens; the card still shows the precise
internal status + `status_evidence` (e.g. "Likely active — portal open, budget not confirmed"), so
the bucket is the coarse filter and the card carries the nuance.

- **Active** — `active`, `likely_active`
- **Possibly active** — `dormant`, `unknown`  (shown by default; never hide potentially-live help)
- **Inactive** — `subsumed`, `superseded`, `lapsed`  (opt-in only; `subsumed`/`superseded` link to the successor via `successor_scheme_id`)

Default results view = Active + Possibly active. Inactive is opt-in.

---

## Primary data sources

- `budget.bihar.gov.in` — **the spine**. Scheme-wise allocations year over year = the status signal.
- `myscheme.gov.in/search/state/Bihar` — national registry, Bihar filter
- `7nishchay-yuvaupmission.bihar.gov.in` — the Saat Nischay employment cluster (MVP)
- `medhasoft.bihar.gov.in` — Kanya Utthan / scholarship disbursement
- Department sites: Education, Labour Resources + Bihar Skill Development Mission, Industries,
  Department of IT (IT Policy 2024)
- District NIC sites (`*.nic.in/schemes`) — cross-checking
- PRS Legislative Research Bihar budget analyses — clean secondary on sector allocations

Most primary docs are Hindi PDFs. Use the LLM to extract → structure → translate, then link the
source. Never drop the source link.

---

## Guardrails

- Bilingual fields (`_en` / `_hi`) are first-class, not an afterthought.
- No `status` value without `status_evidence`.
- Every row has `source_url` + `last_verified`.
- Designing for staleness is mandatory: budgets change yearly, schemes get renamed, portals die.
  Build an update workflow from day one, not a one-time snapshot.
