# Education Expenditure & Accountability Graph — Proposed Schema

*Bihar Policy & Scheme Tracker · **APPROVED 2026-07-13** — realized as a standalone `education`
schema in `supabase/migrations/20260713000000_education_spend_module.sql` (applied to the local DB
and folded into `deploy/initdb/01_schema.sql`). That migration is now authoritative; the draft DDL
in §3 below is annotated where the built schema diverges per the §5 decisions.*

> Companion to `docs/education-spend-discovery.md` (source landscape) and
> `docs/data-gap-register.md` (what needs RTI). This module answers *"who spent how much, on
> which slice of education, for whom, through what, and what did the audit say"* — it is NOT
> the citizen-eligibility finder, and deliberately lives in its own tables, linked to the
> registry where entities overlap.

---

## 1. Design constraints inherited from the codebase

1. **No fabrication.** Reuses the existing `data_provenance` enum verbatim
   (`published | reported | rti_received | rti_filed | rti_needed | estimated`, from
   `20260619000000_scheme_metrics.sql`). A NULL figure + `rti_needed` is a first-class row.
2. **Per-stage provenance columns**, not per-row stages — the pattern already red-teamed in
   `docs/budget-transparency-design.md` (`sector_budget_lines`): *approved*, *released*, and
   *spent* are three columns on one logical line, **each with its own provenance +
   source_url + source_doc**, because they come from different documents published years apart
   (PAB minutes / budget BE → sanction orders / PAB "releases" annexure → audited actuals /
   UC / CAG). Note: that design's migration (`20260625000000_sector_budgets.sql`) was never
   created — this module does not depend on it, but stays pattern-compatible.
3. **Bilingual content columns** (`_en` / `_hi`) for anything a citizen-facing page renders;
   internal/analytical fields (enums, refs, amounts) in English. Table/column identifiers in
   English snake_case, matching every existing migration.
4. **`source_url` + `last_verified` on every row**; figures additionally carry `source_doc`
   (document title + edition, e.g. "PAB Minutes 2024-25, Bihar, para 6.2") and `as_of_date`
   (the figure's own publication date) — the edition-pinning lesson from the PRS trap.
5. Validation lives in `scripts/validate-data.ts` (extended), data authored as YAML under
   `data/education-spend/`, loaded by `scripts/load-data.ts` — same pipeline as
   schemes/policies. DB CHECKs enforce only what is structural.

## 2. Entity-relationship overview

```
departments (existing) ←─ agencies ──┬─ programme_allocations ─── funding_programmes ─┬→ schemes (existing registry)
                            │        │        ▲ (headline row)          │             │
                            │        │        └── expenditure_lines ────┤ (category × stage × beneficiary)
                            │        ├─ tenders ──── tender_tools ──── tools_platforms
                            │        ├─ training_programmes ── training_programme_tools ─┘
                            │        └─ audit_findings ─── (programme_id, agency_id)
                            └ parent_agency_id (self-FK: BEPC → Education Dept)
```

Ten axes → where they live:

| Axis | Where |
|---|---|
| 1. Funding source + share ratio | `funding_programmes.funding_source`, `centre_share_pct`/`state_share_pct` (default) + per-FY split columns on `programme_allocations` |
| 2. Implementing agency | `agencies` (typed; self-hierarchy; linked to existing `departments`) |
| 3. Beneficiary type | `beneficiary_type` enum on `expenditure_lines` + `training_programmes.audience` |
| 4. Education stage | `education_stage` enum on `expenditure_lines`, `training_programmes` |
| 5. Expenditure category | `expenditure_category` enum on `expenditure_lines` |
| 6. Training tools/platforms | `tools_platforms` + join tables |
| 7. Procurement/tenders | `tenders` (first-class: ref, value, vendor, what-it-procures) |
| 8. Audit/accountability | `audit_findings` (CAG para / social audit / UC / PAB) |
| 9. Time | `fiscal_year text` ('2025-26') everywhere, matching existing convention |
| 10. Geography | `district text` (NULL = state-level) — see open decision §5.3 |

## 3. Proposed DDL

> **⚠️ Draft — superseded by the migration.** The block below is the original proposal.
> The built schema (`supabase/migrations/20260713000000_education_spend_module.sql`) is
> authoritative and diverges per the §5 decisions: everything lives in a dedicated
> **`education` schema** with **module-owned types** (incl. a private `education.data_provenance`);
> the registry links (`agencies.department_id`, `funding_programmes.scheme_id`) are **soft,
> FK-less** columns; `nodal_agency_id` is replaced by a **`programme_agencies` join** (with a
> `role`); `district text` is replaced by a **`districts` table + `district_id`** (38 districts
> seeded); and `expenditure_category`/`beneficiary_type` gained `mid_day_meal`/`frontline_workers`
> for PM POSHAN.

```sql
-- ============================================================
-- Education expenditure & accountability graph.
-- Separate-but-linked module: NOT the citizen eligibility finder.
-- Reuses enum data_provenance from 20260619000000_scheme_metrics.sql.
-- ============================================================

-- 3.1 Agencies — who holds/disburses the budget line. Broader than the existing
-- `departments` table (BEPC is a society, SCERT a directorate, BSDM a mission).
create type agency_type as enum (
  'department', 'directorate', 'society', 'mission', 'board',
  'training_institute', 'psu', 'council', 'other'
);

create table agencies (
  id               uuid primary key default gen_random_uuid(),
  name_en          text not null,
  name_hi          text,
  abbrev           text,                          -- 'BEPC', 'SCERT', 'BIPARD'
  agency_type      agency_type not null,
  parent_agency_id uuid references agencies(id),  -- BEPC → Education Dept
  department_id    uuid references departments(id), -- link into the existing registry
  website          text,
  source_url       text not null,
  last_verified    date,
  note_en          text,
  note_hi          text,
  created_at       timestamptz default now()
);

-- 3.2 Funding programmes — the money-side twin of the citizen-facing `schemes` row.
-- Samagra Shiksha, NISHTHA, RGSA etc. are NOT citizen-applicable and must not pollute
-- the finder; where a programme IS also a citizen scheme (BSCC, KYP), scheme_id links them.
create type funding_source as enum (
  'centrally_sponsored',   -- CSS: shared centre:state
  'central_sector',        -- 100% centre
  'state_scheme',
  'externally_aided',
  'mixed'                  -- flag in note_en; do not silently resolve
);

create table funding_programmes (
  id                  uuid primary key default gen_random_uuid(),
  name_en             text not null,
  name_hi             text,
  parent_programme_id uuid references funding_programmes(id), -- component hierarchy:
                                                              -- Samagra Shiksha → teacher-training component
  funding_source      funding_source not null,
  centre_share_pct    numeric,        -- default ratio (60 for Samagra in Bihar); per-FY
  state_share_pct     numeric,        -- deviations live on programme_allocations
  nodal_agency_id     uuid references agencies(id),
  scheme_id           uuid references schemes(id),  -- optional link to citizen registry
  source_url          text not null,
  last_verified       date,
  note_en             text,
  note_hi             text,
  created_at          timestamptz default now()
);

-- 3.3 Allocations — one row = programme × agency × FY (× district when sub-state).
-- The approved / released / spent triad as columns, per-stage provenance.
create table programme_allocations (
  id             uuid primary key default gen_random_uuid(),
  programme_id   uuid not null references funding_programmes(id) on delete cascade,
  agency_id      uuid references agencies(id),   -- budget-holding agency if ≠ nodal
  fiscal_year    text not null,                  -- '2025-26'
  district       text,                           -- NULL = state-level

  approved_cr           numeric check (approved_cr is null or approved_cr >= 0),
  approved_provenance   data_provenance,
  approved_source_url   text,
  approved_source_doc   text,          -- 'PAB Minutes 2024-25 Bihar' / 'DDG Demand 21, 2025-26'

  released_cr           numeric check (released_cr is null or released_cr >= 0),
  released_centre_cr    numeric,       -- split when the source gives it (PAB releases annexure)
  released_state_cr     numeric,
  released_provenance   data_provenance,
  released_source_url   text,
  released_source_doc   text,

  spent_cr              numeric check (spent_cr is null or spent_cr >= 0),
  spent_provenance      data_provenance,
  spent_source_url      text,
  spent_source_doc      text,          -- UC / CAG Finance Accounts / PAB "actuals of previous year"

  as_of_date     date,
  last_verified  date not null,
  note_en        text,
  note_hi        text,
  created_at     timestamptz default now()
);
create index pa_programme_year_idx on programme_allocations (programme_id, fiscal_year);
create index pa_agency_idx on programme_allocations (agency_id);

-- 3.4 Expenditure lines — the fact table: category × stage × beneficiary slices.
-- Finer than an allocation; points at its headline allocation row when known so
-- roll-ups never double-count.
create type expenditure_category as enum (
  'salaries', 'infrastructure_civil', 'training', 'scholarships_dbt',
  'procurement_hardware', 'procurement_software', 'textbooks_content',
  'consultancy', 'administration', 'other'
);

create type education_stage as enum (
  'pre_primary', 'elementary', 'secondary', 'senior_secondary',
  'higher_degree', 'skill_vocational', 'teacher_education',
  'all_stages', 'not_applicable'
);

create type beneficiary_type as enum (
  'students', 'teachers_in_service', 'teachers_pre_service',
  'non_teaching_staff', 'pri_representatives', 'frontline_workers',
  'government_officials', 'mixed', 'not_applicable'
);

create table expenditure_lines (
  id               uuid primary key default gen_random_uuid(),
  allocation_id    uuid references programme_allocations(id) on delete cascade,
  programme_id     uuid references funding_programmes(id),  -- denormalised: a line may
  agency_id        uuid references agencies(id),            -- pre-date its headline row
  fiscal_year      text not null,
  district         text,
  category         expenditure_category not null,
  education_stage  education_stage not null default 'not_applicable',
  beneficiary_type beneficiary_type not null default 'not_applicable',

  approved_cr          numeric check (approved_cr is null or approved_cr >= 0),
  approved_provenance  data_provenance,
  approved_source_url  text,
  approved_source_doc  text,
  spent_cr             numeric check (spent_cr is null or spent_cr >= 0),
  spent_provenance     data_provenance,
  spent_source_url     text,
  spent_source_doc     text,
  -- (no released_* at line granularity: releases are published per-programme, not per-component)

  as_of_date     date,
  last_verified  date not null,
  note_en        text,
  note_hi        text,
  created_at     timestamptz default now()
);
create index el_programme_year_idx on expenditure_lines (programme_id, fiscal_year);
create index el_category_idx on expenditure_lines (category);
create index el_stage_idx on expenditure_lines (education_stage);
create index el_beneficiary_idx on expenditure_lines (beneficiary_type);

-- 3.5 Tenders — first-class procurement entity.
create type tender_category as enum (
  'software', 'hardware', 'civil_works', 'services', 'content', 'mixed', 'other'
);

create table tenders (
  id                 uuid primary key default gen_random_uuid(),
  tender_ref         text,             -- portal tender/NIT ID, verbatim
  title_en           text not null,
  title_hi           text,
  agency_id          uuid references agencies(id),
  programme_id       uuid references funding_programmes(id),
  category           tender_category,
  procures_en        text,             -- what it buys: 'LMS', 'tablets for DIETs', 'attendance app'
  procures_hi        text,
  estimated_value_cr numeric check (estimated_value_cr is null or estimated_value_cr >= 0),
  awarded_value_cr   numeric check (awarded_value_cr  is null or awarded_value_cr  >= 0),
  vendor_name        text,
  published_date     date,
  awarded_date       date,
  tender_status      text check (tender_status in
                       ('published','under_evaluation','awarded','cancelled','completed','unknown')),
  portal_url         text,             -- eproc2.bihar.gov.in / GeM listing
  provenance         data_provenance not null,
  source_url         text not null,
  source_doc         text,
  last_verified      date,
  note_en            text,
  note_hi            text,
  created_at         timestamptz default now()
);
create index tenders_agency_idx on tenders (agency_id);
create index tenders_category_idx on tenders (category);

-- 3.6 Training programmes — teacher / staff / elected-rep training as an entity,
-- so "money spent training mukhiyas, on which platform" is one join away.
create table training_programmes (
  id               uuid primary key default gen_random_uuid(),
  name_en          text not null,
  name_hi          text,
  programme_id     uuid references funding_programmes(id),  -- funding line (RGSA, Samagra…)
  agency_id        uuid references agencies(id),            -- conductor: SCERT, DIET, BIPARD
  audience         beneficiary_type not null,
  education_stage  education_stage not null default 'not_applicable',
  mode             text check (mode in
                     ('in_service','pre_service','induction','refresher','elected_rep','other')),
  fiscal_year      text,
  target_persons   integer,
  trained_persons  integer,
  spend_cr         numeric check (spend_cr is null or spend_cr >= 0),
  provenance       data_provenance not null,
  source_url       text not null,
  source_doc       text,
  last_verified    date,
  note_en          text,
  note_hi          text,
  created_at       timestamptz default now()
);
create index tp_programme_idx on training_programmes (programme_id);
create index tp_audience_idx on training_programmes (audience);

-- 3.7 Tools & platforms — what training/spend runs on.
create table tools_platforms (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,      -- 'DIKSHA', 'e-Shikshakosh'
  name_hi        text,
  owner          text check (owner in
                   ('government_of_india','government_of_bihar','private_vendor','ngo','unknown')),
  kind           text check (kind in
                   ('lms','content_repository','attendance_monitoring','mis_erp',
                    'assessment','device','portal','other')),
  url            text,
  description_en text,
  description_hi text,
  source_url     text not null,
  last_verified  date,
  created_at     timestamptz default now()
);

create table training_programme_tools (
  training_programme_id uuid not null references training_programmes(id) on delete cascade,
  tool_id               uuid not null references tools_platforms(id) on delete cascade,
  primary key (training_programme_id, tool_id)
);

create table tender_tools (
  tender_id uuid not null references tenders(id) on delete cascade,
  tool_id   uuid not null references tools_platforms(id) on delete cascade,
  primary key (tender_id, tool_id)
);

-- 3.8 Audit & accountability trail.
create type audit_source as enum (
  'cag_audit', 'pac_report', 'social_audit', 'utilisation_certificate',
  'pab_minutes', 'internal_audit', 'other'
);

create table audit_findings (
  id                uuid primary key default gen_random_uuid(),
  source_type       audit_source not null,
  report_ref        text,            -- 'CAG Report 4 of 2024 (General & Social Sector), para 2.3'
  agency_id         uuid references agencies(id),
  programme_id      uuid references funding_programmes(id),
  fiscal_years      text,            -- may span audits: '2017-22'
  finding_en        text not null,
  finding_hi        text,
  amount_flagged_cr numeric check (amount_flagged_cr is null or amount_flagged_cr >= 0),
  district          text,
  report_date       date,
  provenance        data_provenance not null,
  source_url        text not null,
  source_doc        text,
  last_verified     date,
  note_en           text,
  note_hi           text,
  created_at        timestamptz default now()
);
create index af_programme_idx on audit_findings (programme_id);
create index af_agency_idx on audit_findings (agency_id);
```

## 4. Validation rules (ported into `scripts/validate-data.ts`)

1. No sourceless number: any non-NULL `*_cr` requires its stage's `provenance` + `source_url`.
2. Awaited provenance (`rti_filed`, `rti_needed`) carries no figure (value must be NULL).
3. `estimated` requires a `note_en` and is forbidden for `spent_*` (actuals are never estimated).
4. `centre_share_pct + state_share_pct = 100` when both present.
5. `released_centre_cr + released_state_cr = released_cr` (±0.01) when all three present.
6. An `expenditure_lines` row with `allocation_id` must agree with the parent on
   `programme_id` + `fiscal_year`.
7. Sum-sanity **warning** (never auto-derive): child expenditure lines exceeding their
   allocation's `approved_cr` prints a warning with both figures.
8. `last_verified` present and not future-dated.
9. `tender_ref` unique when present.
10. Awarded tenders require `vendor_name` or an explanatory `note_en`.

## 5. Decisions — resolved 2026-07-13

Signed off by the maintainer and realized in the migration.

1. **`agencies` vs existing `departments`** → **separate typed `agencies` table** with a
   *soft, FK-less* `department_id` link. Per the broader steer, the **whole module is built
   standalone in its own `education` schema** — a future deep-dive-into-education product,
   decoupled from the citizen finder and liftable into its own database later. It owns all its
   own types (including a private `education.data_provenance` copy); the only ties to the finder
   are two optional FK-less columns (`agencies.department_id`, `funding_programmes.scheme_id`).
2. **Cross-department programmes** → **explicit `programme_agencies` join** with a `role` enum
   (`nodal | co_implementer | conductor | funder | other`). Replaces the draft's scalar
   `nodal_agency_id`; co-implementation is first-class, ambiguity flagged in `note_en`, never
   silently resolved.
3. **Geography** → **real `education.districts` table**, all 38 Bihar districts seeded in the
   migration; allocation/expenditure/audit rows carry `district_id` (NULL = state-level).
   `lgd_code`/`udise_code` left NULL until an authoritative source lands (never fabricated).
4. **PM POSHAN** → **included** as a `funding_programmes` row (it flows through the Education
   Dept in Bihar); tag `education_stage = 'elementary'` and category `mid_day_meal`, with its
   nutrition nature noted. Enums extended accordingly (`expenditure_category.mid_day_meal`,
   `beneficiary_type.frontline_workers` for cook-cum-helpers).
5. Relationship to the (designed, never-built) `sector_budget_lines` module: unchanged — this
   schema is pattern-compatible but independent. If that module is built later, its Education
   sector line becomes the roll-up view over `education.programme_allocations`.

## 6. Seed pipeline

**Built 2026-07-13** (as a SEPARATE pair of scripts, not an extension of `load-data.ts` — the
module is a standalone schema): YAML under `data/education-spend/` (`agencies.yaml`,
`programmes.yaml` with allocations + expenditure lines nested per programme, `audits.yaml`), JSON
Schemas `data/schema/edu-{agency,programme,audit}.schema.json`. Validate with
`npm run data:validate-education` (AJV + the §4 no-fabrication / share-sum / release-split rules;
no DB). Load with `npm run data:load-education` — one transaction: agencies + funding_programmes
upserted by `name_en` (IDs preserved), the join/fact tables rebuilt from YAML each run
(idempotent); registry links (`agency.department_en`, `programme.scheme_en`) resolved as soft,
FK-less lookups. Every priced cell carries its stage's `source_url` + `source_doc`; unverifiable
cells are NULL + `rti_needed`.

First slice loaded: **8 agencies, 6 programmes, 8 agency-roles, 9 allocations, 2 expenditure lines,
3 audit findings** (Samagra Shiksha, PM POSHAN, PMKVY, RGSA, PM-USHA, state-universities grant —
all sourced to CAG / MoPR / PAB). **Not yet authored:** `tenders.yaml` (RailTel proxy),
`training.yaml`, `tools.yaml`, and district-level allocations.
