-- ============================================================
-- Education Expenditure & Accountability Graph.
--
-- A STANDALONE, liftable analytical module — a future "deep dive into education in
-- Bihar", deliberately kept SEPARATE from the citizen scheme-finder (maintainer
-- decision, 2026-07-13). It answers "who spent how much, on which slice of education,
-- for whom, through what, and what did the audit say" — NOT citizen eligibility.
--
-- Architecture choices that make it self-contained (so it can later be lifted into its
-- own database / product without touching the finder):
--   * Everything lives in its own `education` schema.
--   * It owns ALL of its own types, including a private copy of the provenance enum —
--     no hard dependency on public.data_provenance.
--   * The only ties to the finder are two OPTIONAL, FK-LESS "soft" reference columns
--     (agencies.department_id → departments, funding_programmes.scheme_id → schemes).
--     They carry no foreign-key constraint on purpose: the module never *requires* the
--     registry to exist.
--
-- Resolved open decisions (docs/education-spend-schema-proposal.md §5, 2026-07-13):
--   §5.1 agencies         → separate typed table (not extend departments)
--   §5.2 cross-department  → explicit programme_agencies join with a role
--   §5.3 geography         → real districts table (38 Bihar districts seeded here)
--   §5.4 PM POSHAN         → included, tagged elementary / mid_day_meal
--
-- Companion docs: docs/education-spend-discovery.md, docs/education-spend-schema-proposal.md,
-- docs/data-gap-register.md.
-- ============================================================

create schema if not exists education;

-- Module-local provenance enum: a deliberate, independent copy of public.data_provenance
-- (identical values, same semantics per CLAUDE.md) so this module carries no hard
-- dependency on the finder's schema. A NULL figure + rti_needed/rti_filed is a first-class
-- row — the data request itself is the evidence trail.
create type education.data_provenance as enum (
  'published',     -- official published figure (budget doc, dept site, gazette, CAG)
  'reported',      -- credible secondary/news report — flagged for primary cross-check
  'rti_received',  -- obtained via an RTI reply
  'rti_filed',     -- RTI filed, reply awaited (value NULL)
  'rti_needed',    -- not published anywhere; an RTI is required (value NULL)
  'estimated'      -- derived/estimated (never for a headline / actuals figure)
);

-- ------------------------------------------------------------
-- Reference data: Bihar districts. NULL district_id everywhere = state-level.
-- Seeded up-front (decision §5.3). lgd_code / udise_code left NULL — to be filled from
-- an authoritative reference later; never fabricated.
-- ------------------------------------------------------------
create table education.districts (
  id          uuid primary key default gen_random_uuid(),
  name_en     text not null unique,
  name_hi     text,
  lgd_code    text,                     -- Local Government Directory code (fill later)
  udise_code  text,                     -- UDISE+ district code (fill later)
  created_at  timestamptz default now()
);

insert into education.districts (name_en, name_hi) values
  ('Araria', 'अररिया'),
  ('Arwal', 'अरवल'),
  ('Aurangabad', 'औरंगाबाद'),
  ('Banka', 'बांका'),
  ('Begusarai', 'बेगूसराय'),
  ('Bhagalpur', 'भागलपुर'),
  ('Bhojpur', 'भोजपुर'),
  ('Buxar', 'बक्सर'),
  ('Darbhanga', 'दरभंगा'),
  ('East Champaran', 'पूर्वी चंपारण'),
  ('Gaya', 'गया'),
  ('Gopalganj', 'गोपालगंज'),
  ('Jamui', 'जमुई'),
  ('Jehanabad', 'जहानाबाद'),
  ('Kaimur', 'कैमूर'),
  ('Katihar', 'कटिहार'),
  ('Khagaria', 'खगड़िया'),
  ('Kishanganj', 'किशनगंज'),
  ('Lakhisarai', 'लखीसराय'),
  ('Madhepura', 'मधेपुरा'),
  ('Madhubani', 'मधुबनी'),
  ('Munger', 'मुंगेर'),
  ('Muzaffarpur', 'मुजफ्फरपुर'),
  ('Nalanda', 'नालंदा'),
  ('Nawada', 'नवादा'),
  ('Patna', 'पटना'),
  ('Purnia', 'पूर्णिया'),
  ('Rohtas', 'रोहतास'),
  ('Saharsa', 'सहरसा'),
  ('Samastipur', 'समस्तीपुर'),
  ('Saran', 'सारण'),
  ('Sheikhpura', 'शेखपुरा'),
  ('Sheohar', 'शिवहर'),
  ('Sitamarhi', 'सीतामढ़ी'),
  ('Siwan', 'सीवान'),
  ('Supaul', 'सुपौल'),
  ('Vaishali', 'वैशाली'),
  ('West Champaran', 'पश्चिमी चंपारण');

-- ------------------------------------------------------------
-- 1. Agencies — who holds/disburses the budget line (decision §5.1).
-- Broader than the finder's `departments`: BEPC is a society, SCERT a directorate,
-- BSDM a mission, BSEB a board, BSEFCL a corporation, BIPARD a training institute.
-- department_id is a SOFT (FK-less) link into the finder registry.
-- ------------------------------------------------------------
create type education.agency_type as enum (
  'department', 'directorate', 'society', 'mission', 'board',
  'training_institute', 'psu', 'corporation', 'council', 'commission', 'other'
);

create table education.agencies (
  id               uuid primary key default gen_random_uuid(),
  name_en          text not null,
  name_hi          text,
  abbrev           text,                              -- 'BEPC', 'SCERT', 'BIPARD'
  agency_type      education.agency_type not null,
  parent_agency_id uuid references education.agencies(id),  -- BEPC → Education Dept
  department_id    uuid,                              -- SOFT ref → public.departments(id); no FK by design
  website          text,
  source_url       text not null,
  last_verified    date,
  note_en          text,
  note_hi          text,
  created_at       timestamptz default now()
);
create index agencies_parent_idx on education.agencies (parent_agency_id);
create index agencies_type_idx on education.agencies (agency_type);

-- ------------------------------------------------------------
-- 2. Funding programmes — the money-side twin of a citizen `schemes` row.
-- Samagra Shiksha, NISHTHA, RGSA, PM POSHAN etc. scheme_id is a SOFT link to the
-- registry only where a programme is ALSO a citizen scheme (BSCC, KYP).
-- Nodal / co-implementer attribution lives in programme_agencies (decision §5.2),
-- NOT a scalar column here.
-- ------------------------------------------------------------
create type education.funding_source as enum (
  'centrally_sponsored',   -- CSS: shared centre:state
  'central_sector',        -- 100% centre
  'state_scheme',
  'externally_aided',
  'mixed'                  -- flag specifics in note_en; never silently resolved
);

create table education.funding_programmes (
  id                  uuid primary key default gen_random_uuid(),
  name_en             text not null,
  name_hi             text,
  parent_programme_id uuid references education.funding_programmes(id),  -- Samagra → teacher-training component
  funding_source      education.funding_source not null,
  centre_share_pct    numeric,        -- default ratio (60 for Samagra in Bihar); per-FY
  state_share_pct     numeric,        -- deviations live on programme_allocations
  scheme_id           uuid,           -- SOFT ref → public.schemes(id); no FK by design
  source_url          text not null,
  last_verified       date,
  note_en             text,
  note_hi             text,
  created_at          timestamptz default now(),
  constraint fp_centre_share_range check (centre_share_pct is null or (centre_share_pct >= 0 and centre_share_pct <= 100)),
  constraint fp_state_share_range  check (state_share_pct  is null or (state_share_pct  >= 0 and state_share_pct  <= 100)),
  constraint fp_share_sum          check (centre_share_pct is null or state_share_pct is null
                                          or centre_share_pct + state_share_pct = 100)
);

-- 2b. programme × agency roles (decision §5.2) — first-class co-implementation.
create type education.agency_role as enum (
  'nodal', 'co_implementer', 'conductor', 'funder', 'other'
);

create table education.programme_agencies (
  programme_id uuid not null references education.funding_programmes(id) on delete cascade,
  agency_id    uuid not null references education.agencies(id) on delete cascade,
  role         education.agency_role not null,
  note_en      text,
  primary key (programme_id, agency_id, role)
);
create index pgag_agency_idx on education.programme_agencies (agency_id);

-- ------------------------------------------------------------
-- 3. Allocations — one row = programme × agency × FY (× district when sub-state).
-- The approved / released / spent triad as columns, each with its OWN provenance +
-- source, because they come from different documents published years apart
-- (PAB/BE → sanction orders/releases annexure → UC/CAG audited actuals).
-- ------------------------------------------------------------
create table education.programme_allocations (
  id             uuid primary key default gen_random_uuid(),
  programme_id   uuid not null references education.funding_programmes(id) on delete cascade,
  agency_id      uuid references education.agencies(id),   -- budget-holding agency (one row per agency if co-implemented)
  fiscal_year    text not null,                            -- '2025-26'
  district_id    uuid references education.districts(id),  -- NULL = state-level

  approved_cr           numeric check (approved_cr is null or approved_cr >= 0),
  approved_provenance   education.data_provenance,
  approved_source_url   text,
  approved_source_doc   text,          -- 'PAB Minutes 2024-25 Bihar, para 6.2' / 'DDG Demand 21, 2025-26'

  released_cr           numeric check (released_cr is null or released_cr >= 0),
  released_centre_cr    numeric check (released_centre_cr is null or released_centre_cr >= 0),
  released_state_cr     numeric check (released_state_cr  is null or released_state_cr  >= 0),
  released_provenance   education.data_provenance,
  released_source_url   text,
  released_source_doc   text,

  spent_cr              numeric check (spent_cr is null or spent_cr >= 0),
  spent_provenance      education.data_provenance,
  spent_source_url      text,
  spent_source_doc      text,          -- UC / CAG Finance Accounts / PAB "actuals of previous year"

  as_of_date     date,
  last_verified  date not null,
  note_en        text,
  note_hi        text,
  created_at     timestamptz default now(),
  constraint pa_release_split check (released_cr is null or released_centre_cr is null or released_state_cr is null
                                     or abs(released_centre_cr + released_state_cr - released_cr) <= 0.01)
);
create index pa_programme_year_idx on education.programme_allocations (programme_id, fiscal_year);
create index pa_agency_idx on education.programme_allocations (agency_id);
create index pa_district_idx on education.programme_allocations (district_id);

-- ------------------------------------------------------------
-- 4. Expenditure lines — the fact table: category × stage × beneficiary slices.
-- Finer than an allocation; points at its headline allocation row when known so
-- roll-ups never double-count. (No released_* here: releases are published per
-- programme, not per component.)
-- ------------------------------------------------------------
create type education.expenditure_category as enum (
  'salaries', 'infrastructure_civil', 'training', 'scholarships_dbt',
  'procurement_hardware', 'procurement_software', 'textbooks_content',
  'mid_day_meal', 'consultancy', 'administration', 'other'
);

create type education.education_stage as enum (
  'pre_primary', 'elementary', 'secondary', 'senior_secondary',
  'higher_degree', 'skill_vocational', 'teacher_education',
  'all_stages', 'not_applicable'
);

create type education.beneficiary_type as enum (
  'students', 'teachers_in_service', 'teachers_pre_service',
  'non_teaching_staff', 'pri_representatives', 'frontline_workers',
  'government_officials', 'mixed', 'not_applicable'
);

create table education.expenditure_lines (
  id               uuid primary key default gen_random_uuid(),
  allocation_id    uuid references education.programme_allocations(id) on delete cascade,
  programme_id     uuid references education.funding_programmes(id),  -- denormalised: a line may
  agency_id        uuid references education.agencies(id),            -- pre-date its headline row
  fiscal_year      text not null,
  district_id      uuid references education.districts(id),
  category         education.expenditure_category not null,
  education_stage  education.education_stage not null default 'not_applicable',
  beneficiary_type education.beneficiary_type not null default 'not_applicable',

  approved_cr          numeric check (approved_cr is null or approved_cr >= 0),
  approved_provenance  education.data_provenance,
  approved_source_url  text,
  approved_source_doc  text,
  spent_cr             numeric check (spent_cr is null or spent_cr >= 0),
  spent_provenance     education.data_provenance,
  spent_source_url     text,
  spent_source_doc     text,

  as_of_date     date,
  last_verified  date not null,
  note_en        text,
  note_hi        text,
  created_at     timestamptz default now()
);
create index el_programme_year_idx on education.expenditure_lines (programme_id, fiscal_year);
create index el_allocation_idx on education.expenditure_lines (allocation_id);
create index el_category_idx on education.expenditure_lines (category);
create index el_stage_idx on education.expenditure_lines (education_stage);
create index el_beneficiary_idx on education.expenditure_lines (beneficiary_type);

-- ------------------------------------------------------------
-- 5. Tenders — first-class procurement entity (ref, value, vendor, what it procures).
-- ------------------------------------------------------------
create type education.tender_category as enum (
  'software', 'hardware', 'civil_works', 'services', 'content', 'mixed', 'other'
);

create table education.tenders (
  id                 uuid primary key default gen_random_uuid(),
  tender_ref         text unique,      -- portal tender/NIT ID, verbatim (unique when present)
  title_en           text not null,
  title_hi           text,
  agency_id          uuid references education.agencies(id),
  programme_id       uuid references education.funding_programmes(id),
  category           education.tender_category,
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
  provenance         education.data_provenance not null,
  source_url         text not null,
  source_doc         text,
  last_verified      date,
  note_en            text,
  note_hi            text,
  created_at         timestamptz default now()
);
create index tenders_agency_idx on education.tenders (agency_id);
create index tenders_programme_idx on education.tenders (programme_id);
create index tenders_category_idx on education.tenders (category);

-- ------------------------------------------------------------
-- 6. Training programmes — teacher / staff / elected-rep training as an entity, so
-- "money spent training mukhiyas, on which platform" is one join away.
-- ------------------------------------------------------------
create table education.training_programmes (
  id               uuid primary key default gen_random_uuid(),
  name_en          text not null,
  name_hi          text,
  programme_id     uuid references education.funding_programmes(id),  -- funding line (RGSA, Samagra…)
  agency_id        uuid references education.agencies(id),            -- conductor: SCERT, DIET, BIPARD
  audience         education.beneficiary_type not null,
  education_stage  education.education_stage not null default 'not_applicable',
  mode             text check (mode in
                     ('in_service','pre_service','induction','refresher','elected_rep','other')),
  fiscal_year      text,
  target_persons   integer check (target_persons is null or target_persons >= 0),
  trained_persons  integer check (trained_persons is null or trained_persons >= 0),
  spend_cr         numeric check (spend_cr is null or spend_cr >= 0),
  provenance       education.data_provenance not null,
  source_url       text not null,
  source_doc       text,
  last_verified    date,
  note_en          text,
  note_hi          text,
  created_at       timestamptz default now()
);
create index tp_programme_idx on education.training_programmes (programme_id);
create index tp_audience_idx on education.training_programmes (audience);

-- ------------------------------------------------------------
-- 7. Tools & platforms — what training/spend runs on (DIKSHA, e-Shikshakosh, VSK…).
-- ------------------------------------------------------------
create table education.tools_platforms (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
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

create table education.training_programme_tools (
  training_programme_id uuid not null references education.training_programmes(id) on delete cascade,
  tool_id               uuid not null references education.tools_platforms(id) on delete cascade,
  primary key (training_programme_id, tool_id)
);

create table education.tender_tools (
  tender_id uuid not null references education.tenders(id) on delete cascade,
  tool_id   uuid not null references education.tools_platforms(id) on delete cascade,
  primary key (tender_id, tool_id)
);

-- ------------------------------------------------------------
-- 8. Audit & accountability trail (CAG para / social audit / UC / PAB minutes).
-- ------------------------------------------------------------
create type education.audit_source as enum (
  'cag_audit', 'pac_report', 'social_audit', 'utilisation_certificate',
  'pab_minutes', 'internal_audit', 'other'
);

create table education.audit_findings (
  id                uuid primary key default gen_random_uuid(),
  source_type       education.audit_source not null,
  report_ref        text,            -- 'CAG Report 5 of 2024, para 2.3'
  agency_id         uuid references education.agencies(id),
  programme_id      uuid references education.funding_programmes(id),
  district_id       uuid references education.districts(id),
  fiscal_years      text,            -- may span audits: '2017-22'
  finding_en        text not null,
  finding_hi        text,
  amount_flagged_cr numeric check (amount_flagged_cr is null or amount_flagged_cr >= 0),
  report_date       date,
  provenance        education.data_provenance not null,
  source_url        text not null,
  source_doc        text,
  last_verified     date,
  note_en           text,
  note_hi           text,
  created_at        timestamptz default now()
);
create index af_programme_idx on education.audit_findings (programme_id);
create index af_agency_idx on education.audit_findings (agency_id);
create index af_source_idx on education.audit_findings (source_type);

-- NOTE: No row-level security — consistent with the rest of this app, which connects to
-- Postgres as the table owner (no PostgREST/Supabase API layer), so RLS is bypassed anyway.
-- This module is not yet exposed through the finder app; it is an internal analytical graph.
