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
