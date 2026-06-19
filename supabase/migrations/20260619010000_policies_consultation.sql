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
