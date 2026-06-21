-- Generated from supabase/migrations/ — DO NOT edit by hand.
create extension if not exists vector;
create extension if not exists pg_trgm;

-- ==== supabase/migrations/20260618000000_init_schema.sql ====

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

-- ==== supabase/migrations/20260618010000_fuzzy_search.sql ====

-- Fuzzy search: trigram matching so typos and partial words still find schemes,
-- complementing the exact full-text search (search_tsv). pg_trgm is a stock Postgres
-- contrib module (no compile needed, unlike pgvector).

create extension if not exists pg_trgm;

-- Raw concatenated text for trigram similarity / ILIKE (FTS uses search_tsv instead).
alter table schemes add column search_text text
  generated always as (
    coalesce(name_en,'') || ' ' || coalesce(name_hi,'') || ' ' ||
    coalesce(objective_en,'') || ' ' || coalesce(eligibility_en,'') || ' ' ||
    coalesce(benefit_detail,'')
  ) stored;

-- GIN trigram index accelerates both word_similarity() and ILIKE '%…%'.
create index schemes_trgm_idx on schemes using gin (search_text gin_trgm_ops);

-- ==== supabase/migrations/20260618020000_structured_eligibility.sql ====

-- Structured, filterable eligibility for the citizen-facing finder (Step 2).
-- Free-text eligibility_en/_hi stays for DISPLAY; these columns power the facet FILTERS.
--
-- ✅ APPLIED 2026-06-18. App code updated in lockstep (`category` → `categories text[]`):
--    lib/types.ts, lib/queries.ts (faceted searchSchemes), lib/facets.ts (vocab + parse),
--    search/detail pages, seed/seed.ts. Facet VALUES seeded by seed/03_eligibility.ts.
--
-- Design rules honoured (per approved Step 1 + amendments):
--   - personas[] is OCCUPATION / LIFE-SITUATION only. Minority → social_categories,
--     disability → is_for_disabled, BPL → requires_bpl, gender → gender_eligibility.
--     One concept, one stored representation — never two.
--   - Income is single-encoded: income_ceiling (income-stated) XOR requires_bpl (card-based).
--   - land_ownership is agriculture-only (UI surfaces it only for farmer/agri_labourer).
--   - rural_urban DEFERRED (did not recur as a gate in schemes tagged so far) — see note at end.

-- ── Persona / life-situation (occupation only) ──────────────────────────────
alter table schemes add column personas text[] not null default '{}';
alter table schemes add constraint personas_valid check (
  personas <@ array[
    'student','farmer','agricultural_labourer','unemployed_youth','salaried_employee',
    'self_employed_entrepreneur','artisan_weaver','worker_labourer','shg_jeevika_member',
    'senior_citizen','widow','pregnant_lactating_woman'
  ]::text[]
);

-- ── Education level ─────────────────────────────────────────────────────────
alter table schemes add column education_levels text[] not null default '{}';
alter table schemes add constraint education_levels_valid check (
  education_levels <@ array[
    'none','primary','secondary','senior_secondary','iti_diploma','graduate','postgraduate'
  ]::text[]
);

-- ── Gender (single; 'any' = gender-neutral; covers "girl/woman" intake = 'female') ──
alter table schemes add column gender_eligibility text not null default 'any'
  check (gender_eligibility in ('any','female','male','transgender'));

-- ── Social category (Bihar uses SC/ST/EBC/BC; minority lives here, NOT in personas) ──
alter table schemes add column social_categories text[] not null default '{}';
alter table schemes add constraint social_categories_valid check (
  social_categories <@ array['sc','st','ebc','bc','general','minority']::text[]
);

-- ── Age band (null = unspecified) ───────────────────────────────────────────
alter table schemes add column min_age int;
alter table schemes add column max_age int;
alter table schemes add constraint age_band_sane check (
  min_age is null or max_age is null or min_age <= max_age
);

-- ── Income: income_ceiling (income-stated) XOR requires_bpl (card-based). Never both.
--    null income_ceiling = no income bar. ──
alter table schemes add column income_ceiling numeric;            -- annual ₹
alter table schemes add column requires_bpl boolean not null default false;
alter table schemes add constraint income_xor_bpl check (
  not (requires_bpl and income_ceiling is not null)
);

-- ── Domicile (residency-duration nuances, e.g. disability 10-yr, stay in free-text) ──
alter table schemes add column domicile text not null default 'bihar'
  check (domicile in ('bihar','any'));

-- ── Dedicated facet flags (kept OUT of personas[] to avoid double-encoding) ──
alter table schemes add column is_for_disabled boolean not null default false;
alter table schemes add column is_for_startups boolean not null default false;

-- ── Land ownership: agriculture-only; null = not applicable.
--    UI surfaces this filter only when persona is farmer / agricultural_labourer. ──
alter table schemes add column land_ownership text
  check (land_ownership in ('raiyat','non_raiyat','any'));

-- ── Successor link so subsumed/superseded schemes can point the citizen onward ──
alter table schemes add column successor_scheme_id uuid references schemes(id);

-- ── Widen category → categories text[] (a scheme can span sectors, e.g. KYP = skilling+employment) ──
alter table schemes add column categories text[] not null default '{}';
update schemes set categories = array[category] where category is not null;
alter table schemes add constraint categories_valid check (
  categories <@ array[
    'agriculture','education','employment','skilling','industry',
    'social_welfare','health','women_child','housing','financial_inclusion'
  ]::text[]
);
alter table schemes drop column category;   -- also drops its old CHECK + schemes_category_idx

-- ── GIN indexes for array-containment filters ───────────────────────────────
create index schemes_personas_idx          on schemes using gin (personas);
create index schemes_education_levels_idx   on schemes using gin (education_levels);
create index schemes_social_categories_idx  on schemes using gin (social_categories);
create index schemes_categories_idx         on schemes using gin (categories);

-- ── DEFERRED: rural_urban facet ─────────────────────────────────────────────
-- Did not recur as an eligibility GATE in the schemes tagged so far (MVP three, agriculture
-- input/diesel subsidy, pensions, Udyami). Add a `rural_urban` column when a tagged scheme
-- actually needs it (e.g. PMAY-Gramin vs PMAY-Urban).

-- ==== supabase/migrations/20260619000000_scheme_metrics.sql ====

-- Research-mode metrics: a provenance-aware time series for the "Data & impact" view.
-- Holds financial (₹ cr) and beneficiary counts per year, AND dimension-level data-status
-- markers (value NULL) so the page can honestly show "RTI needed / awaiting" instead of a
-- fake number. Every row carries WHERE it came from (provenance + source_url) — no figure
-- without a source, per CLAUDE.md.

create type data_provenance as enum (
  'published',     -- official published figure (budget doc, dept site, gazette)
  'reported',      -- credible secondary/news report — flagged for primary cross-check
  'rti_received',  -- obtained via an RTI reply
  'rti_filed',     -- RTI filed, reply awaited (value NULL)
  'rti_needed',    -- not published anywhere; an RTI is required (value NULL)
  'estimated'      -- derived/estimated (never for a headline figure)
);

create table scheme_metrics (
  id          uuid primary key default gen_random_uuid(),
  scheme_id   uuid not null references schemes(id) on delete cascade,
  dimension   text not null,                 -- 'budget' | 'beneficiaries' | 'district' | 'demographics' | 'outcomes'
  fiscal_year text,                           -- '2025-26'; NULL = dimension-level status marker (drives the provenance panel)
  label       text,                           -- 'sanctioned' | 'disbursed' | 'allocated_be' | 'target' | 'students'
  value       numeric,                        -- NULL when only tracking provenance (e.g. RTI awaited)
  unit        text,                           -- 'cr' (₹ crore) | 'persons'
  provenance  data_provenance not null,
  as_of_date  date,
  source_url  text,
  note        text,
  created_at  timestamptz default now()
);

create index scheme_metrics_scheme_idx on scheme_metrics (scheme_id);
create index scheme_metrics_dimension_idx on scheme_metrics (scheme_id, dimension);

-- ==== supabase/migrations/20260619010000_policies_consultation.sql ====

-- Policies as a first-class, browsable entity (like schemes): sector tags, the actual
-- document link, and PUBLIC-CONSULTATION fields for drafts open for comments. Status is
-- derived (in force / lapsed / superseded / draft) from validity window + these fields.

alter table policies add column categories text[] not null default '{}';
alter table policies add constraint policies_categories_valid check (
  categories <@ array[
    'agriculture','education','employment','skilling','industry',
    'social_welfare','health','women_child','housing','financial_inclusion'
  ]::text[]
);

alter table policies add column policy_type text;   -- 'framework' | 'rules' | 'package' | 'regulation' | 'mission'
alter table policies add column document_url text;  -- the actual policy / draft document (PDF etc.)

-- ── Public consultation (drafts open for comments) ──
alter table policies add column is_draft boolean not null default false;
alter table policies add column consultation_url text;        -- where to read/submit comments (portal)
alter table policies add column consultation_start date;
alter table policies add column consultation_end date;        -- null = window not stated; verify at source
alter table policies add column how_to_comment_en text;       -- plain-language steps to submit a comment
alter table policies add column how_to_comment_hi text;

create index policies_categories_idx on policies using gin (categories);
create index policies_is_draft_idx on policies (is_draft);

-- ==== supabase/migrations/20260619020000_scheme_policy_links.sql ====

-- Map schemes to the policy/act framework(s) they sit under — many-to-many (a scheme can
-- implement more than one policy/act; a policy umbrella has many schemes). Powers the
-- "Part of" link on a scheme, the "Schemes under this" list on a policy, and the Map view.

create table scheme_policy_links (
  scheme_id uuid not null references schemes(id) on delete cascade,
  policy_id uuid not null references policies(id) on delete cascade,
  primary key (scheme_id, policy_id)
);
create index scheme_policy_links_policy_idx on scheme_policy_links (policy_id);

-- ==== supabase/migrations/20260621000000_search_events.sql ====

-- Privacy-respecting search log: what people search for + how many results it returned.
-- No cookies, no IP, no user identity — only the anonymous query shape. The signal that
-- matters most: rows with result_count = 0 are the schemes/keywords people want and we lack.
create table if not exists search_events (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  surface       text not null,                       -- 'finder' | 'guided' | 'navbar'
  q             text,                                -- free-text query (null for facet-only searches)
  filters       jsonb not null default '{}'::jsonb,  -- the eligibility facets used (persona, age, …)
  result_count  int  not null
);
create index if not exists search_events_created_idx on search_events (created_at desc);
create index if not exists search_events_zero_idx    on search_events (result_count) where result_count = 0;
create index if not exists search_events_q_idx        on search_events (lower(q));
