-- Enforce "no status without evidence" (CLAUDE.md) at the DB layer, so the guardrail holds on
-- ANY apply path — not only the validated YAML loader. source_url is already NOT NULL; extend
-- the same to status_evidence and last_verified. (Existing rows already satisfy this: the
-- validator requires status_evidence ≥10 chars and a last_verified date on every record.)
alter table schemes alter column status_evidence set not null;
alter table schemes alter column last_verified  set not null;
