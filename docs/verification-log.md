# Verification log

Append-only record of what was checked, when, and why each status was assigned.
This is the project's "design for staleness" artifact — every status change should
leave a dated entry here with its sources.

---

## 2026-06-18 — MVP cluster (Saat Nischay youth/employment)

Scripts: `seed/seed.ts` (initial insert), `seed/02_verify.ts` (this verification pass).

### Status determinations

| Scheme | Status | Basis |
|---|---|---|
| Bihar Student Credit Card | `active` | ₹300 cr 3rd installment released to BSEFC in FY2025-26 (cumulative ₹900 cr; Drishti IAS, Aug 2025) + live application portal + continues under Saat Nishchay-3 in FY2026-27 budget |
| MNSSBY (Self-Help Allowance) | `likely_active` | Portal live & accepting applications; no scheme-line budget figure located |
| Kushal Yuva Program | `likely_active` | Operational via portal, mandatory for MNSSBY beneficiaries; no scheme-line budget figure |

Full `status_evidence` (with source URLs) is stored on each row and shown on the detail page.

### Why `budget_allocations` is still EMPTY (important)

The CLAUDE.md spine is *scheme-wise budget allocation, year over year*. This pass could **not**
obtain authoritative scheme-line figures:

- **PRS Bihar Budget Analysis 2026-27** does not break out any of these three schemes by name
  (only sector/department totals, e.g. Education Dept salary ₹36,658 cr BE 2026-27).
- The only concrete number found — **₹300 cr (FY2025-26) → ₹900 cr cumulative** for BSCC — is a
  **sanction/release to BSEFC**, not a budget-estimate (BE/RE) line, and is secondary-sourced.
  Recording it in `budget_allocations.allocated_cr` would mislabel it, so it lives in BSCC's
  `status_evidence` instead.
- Primary `budget.bihar.gov.in` demand-for-grants PDFs were **not** parsed (not web-extractable
  in this pass).

Per "wrong info is worse than no info," no rows were fabricated. The detail page's empty-state
already points to `budget.bihar.gov.in` as the next source.

### Verified content fields

Replaced the seeded `TODO` placeholders with sourced bilingual content for all three
(objective, eligibility, benefit, target, launch date where confirmed). `last_verified = 2026-06-18`.
Sources: saran.nic.in (BSCC), muzaffarpur.nic.in (MNSSBY), 7nishchay portal/guidelines, myScheme.

### Open items (next verification pass)

- [ ] **Primary budget figures**: extract scheme-wise BE/RE from `budget.bihar.gov.in`
      demand-for-grants PDFs → populate `budget_allocations` → confirm/upgrade BSCC FY2026-27
      and re-evaluate MNSSBY/KYP (`likely_active` → `active` if a line exists).
- [ ] **KYP eligibility age**: sources conflict (15–25 vs 15–28). Confirm against the KYP
      guideline (rev. 22/02/2017).
- [ ] **KYP launch date**: left null; confirm (cluster launched ~2 Oct 2016).
- [ ] **BSCC interest-free terms**: corroborated by myScheme + 2025 reform reporting; confirm
      current terms against a primary notification.

---

## 2026-06-18 — Structured-eligibility finder (Step 2 completed)

Migration `20260618020000_structured_eligibility.sql` applied; app wired in lockstep so the
project is now a **finder**, not just a registry. Script: `seed/03_eligibility.ts`.

### What changed
- DB: `category` (singular) → `categories text[]`; added the filterable facet columns
  (`personas`, `education_levels`, `gender_eligibility`, `social_categories`, `min_age`,
  `max_age`, `income_ceiling`, `requires_bpl`, `domicile`, `is_for_disabled`,
  `is_for_startups`, `land_ownership`, `successor_scheme_id`) + GIN indexes.
- Code: `lib/types.ts` (new shape + facet vocab types), `lib/queries.ts` (`searchSchemes`
  now takes `SchemeFilters` and ANDs facet predicates onto the FTS/trigram search),
  `lib/facets.ts` (bilingual option lists + URL-param parsing + education-ladder expansion),
  `lib/status.ts` (internal status → citizen bucket mapping), `/search` + `LiveSearch`
  (facet UI), `/schemes/[id]` ("Who can apply" section), `seed/seed.ts`.

### Facet values assigned (DERIVED from the verified free-text eligibility, no new facts)

| Scheme | personas | education (entry) | age | categories |
|---|---|---|---|---|
| Bihar Student Credit Card | student | senior_secondary | — | education |
| MNSSBY | unemployed_youth | senior_secondary | 20–25 | employment |
| Kushal Yuva Program | unemployed_youth | secondary | 15–**?** | skilling, employment |

- **KYP upper age left NULL on purpose.** Sources conflict (15–25 vs 15–28); per "never hide
  potentially-live help," `max_age` is unconstrained (matches any age ≥ 15) rather than
  asserting a bound. The conflict is already flagged in `eligibility_en` and stays an open
  item below. The citizen picks their *highest* education; `expandEducation()` widens it down
  the ladder so a graduate still matches a "class-12-pass" scheme.

### Verified behaviour (smoke + runtime)
`persona=student`→BSCC only; `unemployed_youth`+`age=22`→KYP+MNSSBY; `age=28`→KYP only
(MNSSBY's 20–25 excludes); `education=secondary`→KYP only; `education=graduate`→all three;
`category=skilling`→KYP. `tsc --noEmit`, `next build`, and live SSR/API/detail all pass.

## 2026-06-19 — Research mode: BSCC first data series + provenance

Migration `20260619000000_scheme_metrics.sql` adds `scheme_metrics` — a provenance-aware
time series (financial + beneficiary values per year, plus dimension-level data-status
markers). Script: `seed/04_metrics_bscc.ts`. Powers the scheme page's new "Data & impact"
section. **No RTI used** — all sourced from public reporting.

### BSCC figures recorded (provenance = `reported`, to cross-check vs budget.bihar.gov.in)
| FY | Funds (₹ cr) | Students | Note |
|---|---|---|---|
| 2024-25 | 1,715.23 (disbursed) | 80,236 | loans disbursed |
| 2025-26 | 1,013.23 (sanctioned) | 1,27,000 (target) | Finance Dept sanction on Education Dept proposal |

Source: thedailyjagran.com (BSCC 2025-26 report). These are **sanction/disbursement** figures,
**not** verified BE/RE — flagged `reported`, not `published`, pending a primary cross-check.

### Honest gaps (provenance = `rti_needed`, value NULL — shown as "RTI needed" on the page)
- District-wise distribution · Demographic breakdown · Course-completion/repayment outcomes.
  None published; each needs an RTI. The page shows the request status instead of a number.

### Scope finding (public-source scan, this session)
- **Budget**: scheme-line is available for marquee schemes (BSCC), cluster-level otherwise
  (KYP/MNSSBY sit under Saat Nishchay-2 ≈ ₹5,972 cr FY25-26, no individual line found).
- **Beneficiary headline counts can be public** (BSCC's 80,236 → 1.27 lakh came from reporting,
  no RTI). RTI is needed for the *granular* district/demographic splits, not always the headline.
- **Breadth**: ~35 Bihar schemes are cheaply listable (schemesinindia.in etc.); the bottleneck
  is per-scheme status verification, not data entry.

## 2026-06-19 — Dark theme

Token layer moved to CSS variables (RGB triplets) in `globals.css`; `tailwind.config.ts` uses
`rgb(var(--x) / <alpha-value>)` so the same utilities work in both themes and opacity modifiers
still work. `.dark` on `<html>` flips the palette. Theme is cookie-backed (`theme`), read at SSR
in `app/layout.tsx` (no flash / no hydration mismatch); `components/ThemeToggle.tsx` toggles the
class + cookie. New tokens: `bg` (page) and `surface` (cards) — `bg-white` was replaced by
`bg-surface` throughout. Default is light; FOSS green stays the single accent in both.

## 2026-06-19 — Visual redesign, Policies vertical, breadth

### Visual standard (site-wide)
Scheme + policy detail pages rebuilt visual-first: hero with a prominent **Apply / consultation
CTA**, **key-fact tiles** (icon + value), **icon rows** for "Who can apply", and titled **Cards**.
Shared primitives in `components/ui.tsx` (`Card`, `FactTile`, `Row`) + an inline-SVG `components/Icon.tsx`
(no external icon lib). Status evidence redesigned: prose split from its source links (`splitEvidence`),
sources shown as hostname chips. Data & impact figures now show their source chips. All in the
minimal B&W + FOSS-green system, light + dark, EN + HI.

### Policies vertical (new entity, like schemes)
Migration `20260619010000_policies_consultation.sql` adds sector tags, `document_url`, and
public-consultation fields (`is_draft`, `consultation_url/start/end`, `how_to_comment_*`). New
`/policies` catalogue (filter: Open for comments / In force / Lapsed-replaced + sector + search)
and `/policies/[id]` detail (visual, consultation + "how to comment", research panel). Status is
DERIVED (`lib/policy.ts`: open / draft_closed / in_force / lapsed / superseded). Seeded 7 REAL
policies (`seed/06_policies.ts`): IT Policy 2024 (period 09.01.24–08.12.29), BIPPP 2025, Logistics
2024, Export 2024, EV 2023, Semiconductor 2026, and the **Labour Codes Draft Rules 2025** as an
open-consultation example (deadline left to verify — not fabricated). Aggregator-sourced rows are
flagged to cross-check against the official gazette.

### Breadth (3 → 11 schemes), all public-sourced, NO RTI
`seed/07_breadth.ts` + `seed/08_breadth2.ts` add 8 schemes, each `likely_active` (portal live /
recent cycle; budget NOT verified — said so in status_evidence), with structured eligibility from
the source: Kanya Utthan, Udyami (18–45), Vridhjan Pension (60+), Laghu Udyami (income ≤ ₹72k/yr),
Krishi Input Anudan (farmer, raiyat/non-raiyat), Kanya Vivah (female, income ≤ ₹60k/yr),
**Divyangjan Pension (is_for_disabled)**, Balak/Balika Cycle. Finder filtering verified across
persona/age/gender/category/disability. Amounts/ages are reported figures to cross-check at portals.

### Dark theme
Token layer → CSS variables; `.dark` on `<html>` flips the palette; cookie-backed, read at SSR
(no flash). ☀/☾ toggle in the header. (See also the dark-theme note below.)

## 2026-06-19 — endoflife.date-inspired upgrade (branch `eol-ideas`)

endoflife.date is this project's sibling — it answers "is this still supported, and when does it
end?" for software; we answer it for schemes/policies. Adopted its presentation language, staying
honest where our status is derived (not official). All date-driven — **no RTI needed**.

- **Relative-date language** (`lib/dates.ts`, bilingual, deterministic): "Verified 1 day ago /
  today" on scheme cards + status evidence; "valid 3 yr 5 mo more" / "lapsed X ago" /
  "closes in N" on policy cards + detail. `isStale()` flags `last_verified` > 1 year.
- **Lifecycle timeline** (`components/Timeline.tsx`): validity-window Gantt with a "now" marker on
  policies (IT Policy 2024 → 2029; superseded 2016 muted); launched → now with confirmed
  budget-year ticks on schemes (BSCC: FY2024-25, FY2025-26). Renders only where dates exist.
- **Dense status-table view**: Cards ⇄ Table toggle on `/search` — Scheme · Sector · Status ·
  Last budget · Verified (+ stale flag). The researcher's bird's-eye; reuses filtered+sorted rows.

Baseline tagged `v0.1-baseline` (on `main`) before this work. Verified: `tsc`, `next build`, and
all routes 200 in light/dark + EN/HI. Not yet built (proposed next): iCal deadline feed, JSON API
+ open data, embeddable status badges.

## 2026-06-19 — Mapping, global search, startup, fixes (branch `policy-mapping`)

- **dd-mm-yyyy dates** everywhere (`lib/dates.ts fmtDate`); **Table view** is the catalogue default.
- **Budget framing**: budget & beneficiaries are PUBLIC dimensions → shown as "Public · to add"
  (from budget.bihar.gov.in) when absent, never "RTI needed" (only district/demographics/outcomes are).
- **Back button keeps filters**: URL sync moved from `window.history.replaceState` to `router.replace`.
- **Global navbar search** → `/find` groups matching schemes + policies (plain GET form).
- **Startup**: Bihar Startup Policy 2022 + Startup Seed Fund scheme (`is_for_startups`).
- **Scheme ↔ policy mapping** (`scheme_policy_links`, many-to-many): Saat Nishchay-2 umbrella policy
  seeded + youth cluster linked; Startup Fund → Startup Policy. Scheme shows "Part of <policy>";
  policy shows "Schemes under this"; new **/map** view (policy → schemes nodes) + nav link.
- Now: 12 schemes, 10 policies (incl 1 draft, 1 superseded, 1 mission umbrella).
- **Inactive coverage**: inactive *policies* demonstrated (2016 superseded); inactive *schemes*
  await real sourced lapsed examples (not fabricated).
- Verified: `tsc`, `next build`, all routes 200 (light/dark, EN/HI). On `policy-mapping`, not yet merged to `main`.

## Other progress this session (non-data)

- **Search synonyms** (`lib/queries.ts`): small bilingual alias map (loan→credit card,
  allowance/berojgari→swayam sahayata bhatta, skill/training→kushal yuva, …) OR-expanded into the
  full-text query. Covers common paraphrases without a semantic-search pipeline. Extend freely.
- **Semantic search / embeddings: deferred.** The `vector(1536)` column + ivfflat index stay in
  the schema (cost nothing empty). For a small, fixed-vocabulary catalog, FTS + synonyms dominate
  on value-per-effort. Revisit at hundreds of schemes with real missed-query evidence.
- **Local embeddings (when revisited)**: to stay no-cloud, use a local model via **Ollama**
  (e.g. `nomic-embed-text`, 768-dim — note the schema is `vector(1536)`, so either switch the
  column dim or pick a 1536-dim local model). Decision deferred to the maintainer; see
  `memory/no-cloud-self-host.md` re: the Anthropic-API tension in CLAUDE.md.

## Larger future work (not started — needs direction)

- Expand coverage beyond the MVP cluster (education schemes → industry/IT policies).
- The recurring year-over-year budget-tracking job (re-checks allocations, flags status drift).
