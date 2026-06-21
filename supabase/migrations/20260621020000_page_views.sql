-- Privacy-respecting page-view log. Like search_events: NO cookies, NO IP, NO identity,
-- NO user-agent — only the (already public) path that was viewed + a derived entity link.
-- Written by a client-side beacon (/api/track), so it counts views even when the HTML is
-- served from the CDN edge cache (a server-side counter would miss every cache HIT).
create table if not exists page_views (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  path        text not null,
  locale      text,                       -- 'en' | 'hi' | null
  entity_type text,                        -- 'scheme' | 'policy' | null (listing/other pages)
  entity_id   uuid                         -- the scheme/policy id, when the path is a detail page
);
create index if not exists page_views_created_idx on page_views (created_at desc);
create index if not exists page_views_entity_idx  on page_views (entity_type, entity_id);
