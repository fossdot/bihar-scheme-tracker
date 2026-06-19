-- Bihar Policy & Scheme Tracker — initial schema.
-- Mirrors the data model in CLAUDE.md (the source of truth). Core DDL is verbatim;
-- the RLS block at the end is an addition for the read-via-anon / write-via-service-role
-- split this app uses (see note above that block).

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
  category             text check (category in ('education','employment','industry')),
  launch_date          date,
  objective_en         text,
  objective_hi         text,
  eligibility_en       text,
  eligibility_hi       text,
  benefit_type         text,          -- e.g. cash transfer, loan, training, subsidy
  benefit_detail       text,
  target_beneficiary   text,
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

-- full-text search.
-- 'simple' config (no stemming / stopwords) is intentional for mixed Hindi + English text.
alter table schemes add column search_tsv tsvector
  generated always as (
    to_tsvector('simple',
      coalesce(name_en,'') || ' ' || coalesce(name_hi,'') || ' ' ||
      coalesce(objective_en,'') || ' ' || coalesce(eligibility_en,''))
  ) stored;
create index schemes_search_idx on schemes using gin (search_tsv);
create index schemes_embedding_idx on schemes using ivfflat (embedding vector_cosine_ops);

-- Helpful lookup indexes for the detail page / future filters.
create index schemes_category_idx on schemes (category);
create index schemes_status_idx on schemes (status);
create index budget_allocations_scheme_idx on budget_allocations (scheme_id);

-- NOTE: No row-level security here. This app connects directly to Postgres via
-- node-postgres as the table owner (no PostgREST/Supabase API layer), so RLS would
-- be bypassed anyway. If a least-privilege read-only app role is added later, revisit.
