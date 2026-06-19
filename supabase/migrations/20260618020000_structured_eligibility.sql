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
