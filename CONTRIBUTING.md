# Contributing to the Bihar Scheme Tracker

Thank you for helping. This project helps a Bihar citizen find the government schemes they
actually qualify for — and tells them honestly whether each is still running. That only works if
the data is **accurate and sourced**. So the contribution rules are mostly about evidence.

**The golden rule: every fact links to an official source, and status is derived from evidence —
never asserted.** Wrong information is worse than no information.

---

## Three ways to contribute

### 1. Report something wrong or outdated (easiest — no code)
Open an issue → **"🔎 Report incorrect or outdated info"**. Tell us the scheme, what's wrong, the
correct value, and **an official source link**. That's it — a maintainer takes it from there.

### 2. Suggest a scheme to add
Open an issue → **"➕ Suggest a scheme or policy to add"** with a source link.

### 3. Submit the change yourself (Pull Request)
The data lives as one human-readable file per scheme/policy under [`data/`](./data). You can edit it
right in the GitHub web UI — no local setup needed.

- **Correct a scheme:** edit its file in [`data/schemes/`](./data/schemes).
- **Add a scheme:** copy an existing file in `data/schemes/`, rename it `your-scheme-name.yaml`, and
  fill it in.
- **Policies** live in [`data/policies/`](./data/policies) the same way.

Open a PR. CI automatically validates your file (see below). A maintainer reviews the **sources**,
then merges.

---

## The data format

Each file is YAML. The shape and the allowed values are defined and enforced by a JSON Schema in
[`data/schema/`](./data/schema). Look at any existing file (e.g.
[`data/schemes/bihar-student-credit-card-scheme.yaml`](./data/schemes/bihar-student-credit-card-scheme.yaml))
as a template.

**Required on every scheme:** `name_en`, `categories`, `status`, `status_evidence`, `source_url`,
`last_verified`. Everything else is optional but welcome (especially the Hindi `_hi` fields and the
structured eligibility — `personas`, `min_age`/`max_age`, `education_levels`, `gender_eligibility`,
`social_categories`, `income_ceiling`, `domicile` — which power the finder).

A few rules the validator checks for you:

- **`source_url` is mandatory** and must be a real URL. Prefer official sources (`*.gov.in`,
  `*.nic.in`, `*.bihar.gov.in`, PIB, myScheme) over blogs.
- **`status` must come with `status_evidence`** — a sentence saying *what you checked*, with a date
  and source. Use `active` only when there's a current-year signal (budget line, recent
  notification, live portal cycle). When unsure, use `likely_active` or `unknown` — don't guess.
- **No fabricated figures.** If an amount is only *reported* (not officially confirmed), say so in
  the text: "reported ₹X — verify at portal".
- Dates are `YYYY-MM-DD`. `last_verified` is the day you checked the source (not in the future).
- `requires_bpl` and `income_ceiling` are mutually exclusive (a scheme uses one or the other).
- Status values: `active`, `likely_active`, `dormant` (no allocation 1–2 yrs), `subsumed`/`superseded`
  (set `successor_scheme`), `lapsed`, `unknown`.

The allowed values for `categories`, `personas`, `education_levels`, `social_categories`, etc. are
listed in [`data/schema/scheme.schema.json`](./data/schema/scheme.schema.json).

---

## Validate before you push (optional, for local setup)

```bash
npm install
npm run data:validate
```

This checks every file against the schema and the rules above, and prints any errors. The same
check runs automatically on your PR.

> Existing departments to reuse (copy the name exactly): see the `department_en` values across
> `data/schemes/` — e.g. "Education Department, Government of Bihar", "Government of India (Central
> Scheme)". Reusing the exact name keeps departments from duplicating.

---

## How it reaches the live site

The files in `data/` are the source of truth. After a PR merges, a maintainer loads the data into
the database (`npm run data:load`) and redeploys, so [yojana.bodhya.net](https://yojana.bodhya.net)
reflects the change. (Automating this on merge is on the roadmap.)

## Tone & scope

Plain, direct, citizen-first language. Bilingual (English + Hindi) wherever possible. This is a
**finder for citizens** and a **catalogue for researchers** — not a place for opinion or advocacy.
Stick to what the sources say.
