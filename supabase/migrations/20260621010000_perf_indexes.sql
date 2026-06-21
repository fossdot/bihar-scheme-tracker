-- Index the department foreign keys (joined on every detail page + sitemap).
create index if not exists schemes_department_idx  on schemes (department_id);
create index if not exists policies_department_idx on policies (department_id);
-- (scheme_metrics(scheme_id) is already indexed by its own migration, 20260619000000.)
