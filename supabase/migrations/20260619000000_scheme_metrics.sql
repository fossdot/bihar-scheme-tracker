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
