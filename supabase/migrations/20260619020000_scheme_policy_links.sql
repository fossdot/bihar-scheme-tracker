-- Map schemes to the policy/act framework(s) they sit under — many-to-many (a scheme can
-- implement more than one policy/act; a policy umbrella has many schemes). Powers the
-- "Part of" link on a scheme, the "Schemes under this" list on a policy, and the Map view.

create table scheme_policy_links (
  scheme_id uuid not null references schemes(id) on delete cascade,
  policy_id uuid not null references policies(id) on delete cascade,
  primary key (scheme_id, policy_id)
);
create index scheme_policy_links_policy_idx on scheme_policy_links (policy_id);
