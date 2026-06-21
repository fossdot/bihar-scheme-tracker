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
