---
description: Add or update a scheme in data/schemes/ as a source-verified draft (research → draft YAML → validate). Never adjudicates status.
argument-hint: <scheme name to add, or the data/schemes/*.yaml file to update>
---

You are adding or updating a Bihar scheme in this repo's source-of-truth data (`data/schemes/*.yaml`).
Target: **$ARGUMENTS**

Read `CLAUDE.md` and `data/schema/scheme.schema.json` first — they are the contract. Then:

## 1. Add vs. update
- Search `data/schemes/` for an existing file matching the target (by `name_en` or filename). If one
  exists, you are **updating** it — preserve its `id`-less structure and only change what the evidence
  supports. Otherwise you are **adding** a new file named `kebab-case-of-name-en.yaml` (match the
  naming of neighbouring files).

## 2. Research — official sources first, mine before you assume
Gather facts from **official** sources (prefer `*.bihar.gov.in`, the scheme portal, `budget.bihar.gov.in`,
`myscheme.gov.in`, department sites, PIB/PRS). Use WebSearch/WebFetch. Capture a real `source_url` for
every claim. Most primary docs are Hindi PDFs — extract and translate them.

## 3. Draft the YAML — the no-fabrication rules are HARD
- **Status is DERIVED FROM EVIDENCE, never guessed.** If you cannot establish it, use `unknown` and
  write what you checked in `status_evidence`. **Default to `unknown` over a confident guess.**
- `status: active` requires a **current-FY budget line and/or a recent notification/disbursement**.
  If it's only "the portal is live", that's `likely_active`, not `active` (the validator warns on this).
- **Never invent a number.** Beneficiary/budget/district figures go in `metrics[]`, each with its own
  `provenance` + `source_url`. Where the figure isn't published, set `value: null` with
  `provenance: rti_needed` (or `rti_filed`) — the honest placeholder, never a plausible fake. `estimated`
  requires a `note` explaining the basis.
- **Bilingual is first-class:** fill both `_en` and `_hi` (name, objective, eligibility, benefit, notes).
- **Every record:** `source_url` + `last_verified` (use today's date only if you actually verified today)
  + `status_evidence` (≥10 chars, says what was checked, with a date/source).
- Cross-field rules the validator enforces: `requires_bpl` and `income_ceiling` never both set;
  `min_age ≤ max_age`; `land_ownership` only for agriculture schemes; `successor_scheme` only for
  `subsumed`/`superseded` and it must name an **existing** scheme; `last_verified` not in the future.
- Use only the enum values in the schema for `categories`, `personas`, `education_levels`,
  `social_categories`, `gender_eligibility`, `domicile`, `land_ownership`, `status`, metric `dimension`
  and `provenance`.

## 4. Validate, then hand back
- Run `npm run data:validate`. Fix every error; address warnings or explain why they stand.
- **Present the draft for the maintainer to review.** If status is uncertain, say so and leave it
  `unknown` — do not assert. Do **not** run `data:load` and do **not** commit unless explicitly asked.
