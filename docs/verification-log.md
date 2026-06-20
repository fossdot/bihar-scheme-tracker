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

## 2026-06-19 — Big breadth + UX (on `main`)

Catalogue grew 12 → **64 schemes**, **12 policies**, 14 departments. All public-sourced;
conservative `likely_active` (or derived inactive); figures REPORTED ("verify at portal") — no
fabrication. Worked directly on `main` (per user; no feature branches).

- **State breadth (+22 then +4)**: scholarships, women (Mahila Rojgar, JEEViKA), agriculture
  (Karpoori Kisan Samman, Fasal Sahayata, Krishi Yantra, Bagwani, Niji Nalkoop, Diesel Anudan),
  welfare (Parvarish, Parivarik Labh, widow pension), housing, electricity, water, MGNREGA, etc.
- **Central (+10)**: PM-KISAN, Ayushman Bharat PM-JAY, PMAY-G/U, Ujjwala, PM Vishwakarma,
  PM SVANidhi, Mudra, Sukanya Samriddhi, Atal Pension — dept "Government of India (Central Scheme)".
- **Central batch 2 (+9)**: PMJJBY, PMSBY, PM-SYM, PMKVY, Stand-Up India, PM POSHAN, e-Shram,
  PMMVY, PMJDY (insurance / pension / skilling / financial inclusion / maternity).
- **District (+3)**: Kabir Antyeshti Anudan, NFBS, DMFT — dept "District Administration (Bihar)".
- **Inactive (+4)**: Indira Awaas Yojana → PMAY-G, Rajiv Awas Yojana → PMAY-U (subsumed, successor
  linked), RGGVY (subsumed→DDUGJY), BRGF (lapsed). Scheme detail shows "continues via <successor>".
- **Mapping**: umbrella policies (Saat Nishchay-2, Startup Policy, Krishi Road Map, Social Security
  Pensions) + 14 scheme↔policy links; /map redrawn as a branching tree. Scheme "Part of"; policy
  "Schemes under this".
- **UX**: global navbar search → /find (schemes + policies); in-page search boxes removed;
  filters persist across Back (sessionStorage, mount-clobber bug fixed); dd-mm-yyyy dates; budget
  framed "Public · to add" not RTI; Similar schemes / Related policies sections; minimal **logo** +
  favicon (app/icon.svg).
- Status spread: 1 active, 50 likely_active, 3 subsumed, 1 lapsed. Verified: tsc + all routes 200
  (light/dark, EN/HI). Repo: github.com/fossdot/bihar-scheme-tracker (private), pushed to `main`.

## 2026-06-19 — Budget allocations (the status "spine"): first real scheme-line figures

A genuine run at `budget.bihar.gov.in`. **Finding (decisive):** the state's own
`Demands_For_Grants_2025-26.pdf` (45 MB, 108 pp), `Budget_Highlights`, and
`Explanatory_Memorandum` carry **no text layer** — `pypdf` extracts 0 characters per page and the
pages contain no image XObjects either, i.e. the text is rendered as **vector paths**. They are
therefore **not machine-extractable** without OCR of dense Hindi budget tables, which would risk
transposed digits — unacceptable under "wrong info is worse than no info." (This nails down the
"not web-extractable" note from the MVP pass with an actual attempt + diagnosis.)

**What worked:** PRS Legislative Research's *Bihar Budget Analysis* (2025-26 and 2026-27) is
born-digital and itemises select schemes' Budget Estimates, citing the official Bihar Budget
Documents. Seeded `budget_allocations` only where a PRS scheme call-out maps cleanly to a scheme in
our DB. Umbrella heads ("Mahila Sashaktikaran", "Power subsidy", "Sub-mission on Agricultural
Mechanisation", "Samagra Shiksha") were **deliberately not attributed** to any single scheme.

| Scheme | 2025-26 BE | 2026-27 BE | New status |
|---|---|---|---|
| MGNREGA (Bihar) | ₹4,392 cr | ₹3,192 cr | active (current-FY line) |
| PMAY — Urban | ₹2,355 cr | ₹2,842 cr | active (current-FY line) |
| PMAY — Gramin | ₹4,320 cr | — (not itemised in 2026-27 PRS) | active |
| Mukhyamantri Vriddhjan Pension | ₹828 cr | — | active |

Sources: PRS *Bihar Budget Analysis 2025-26* and *2026-27* (PDFs), each citing Bihar Budget
Documents; stored as `budget_allocations.source_url` and quoted in `status_evidence` with the FY.
6 allocation rows; 4 schemes likely_active → **active**. Status spread now: 5 active, 55
likely_active, 3 subsumed, 1 lapsed. Verified: MGNREGA detail page renders the two-year budget
series + "Active". Seed: `seed/18_budget.ts`.

**Next on the spine:** the only path to the remaining scheme-line figures (BSCC, MNSSBY, KYP, the
scholarship schemes — none itemised by PRS) is OCR of the Bihar demand PDFs or an RTI; both are
slower, lower-confidence routes deferred until they can be cross-checked.

## 2026-06-19 — Top-scheme verification pass (citizens-first)

Verified the 16 most-searched citizen schemes against **authoritative current sources** (official
portals, PIB, newsonair.gov.in, myScheme) — NOT SEO blogs — via four parallel research agents, then
applied confirmed/corrected facts + dated `status_evidence` with the source. Status moved to
`active` only where there was a concrete current-year signal; otherwise held honestly.

**15 → `active`** (evidence-backed): BSCC, MNSSBY, KYP, Kanya Utthan, Mahila Rojgar, Udyami,
JEEViKA, Laghu Udyami, Vriddhjan/Widow/Divyangjan pensions, e-Kalyan, Krishi Input Anudan,
PM-KISAN, PM-JAY. **1 held at `likely_active`** — Bihar Rajya Fasal Sahayata (portal live + rates
known, but no current-season notification fetched → not upgraded, per "default to unknown over a
confident guess").

Notable **corrections** (the no-misinformation rule in action):
- **Mukhyamantri Mahila Rojgar Yojana** — was stored as a "₹10,000/**month** stipend"; it is a
  **one-time ₹10,000 grant** + optional up-to-₹2-lakh top-up, delivered via JEEViKA/SHGs (launched
  26 Sep 2025). Portal corrected toward brlps.in.
- **BSCC** — now **interest-free** for all categories (Sept 2025 reform; was 4% / 1%), repayment extended.
- **Pensions** (old-age / widow / disability) — flat **₹1,100/month** since July 2025 (was ₹400).
- **KYP** age 15–25 → **15–28**; **Udyami** 18–45 → **18–50**; Kanya Utthan intermediate amount is
  division-based (₹25,000 / ₹15,000); Laxmibai widow pension income ceiling ₹60,000 added.

Hard current-FY signals captured in evidence: PM-KISAN 22nd installment released 13 Mar 2026
(₹18,640 cr to 9.32 cr farmers), 23rd due 20 Jun 2026; Krishi Input Anudan open 20–24 Jun 2026.
Status spread now: **18 active**, 42 likely_active, 3 subsumed, 1 lapsed. Seed: `seed/19_verify.ts`.
(Portal-liveness curl sweep was run but is unreliable from this environment — many .nic.in/.bihar
hosts fail TLS/WAF even when live — so it was used only as a soft positive signal, never to downgrade.)

## 2026-06-19 — Verification pass 2: the remaining 45 schemes (whole catalogue now verified)

Verified every remaining scheme (41 likely_active + 4 inactive) against authoritative current
sources via eight parallel research agents (official portals, PIB, newsonair, myScheme — not blogs),
applying confirmed/corrected facts + dated, sourced `status_evidence`. **Every one of the 64 schemes
now carries a "Verified 2026-06-19" evidence line.** Final spread: **45 active, 14 likely_active,
4 subsumed, 1 lapsed** (0 unverified). Held honestly at `likely_active` where no current-year
signal: Stand-Up India (extension unconfirmed), Niji Nalkoop, Jananayak Karpoori (new 2026-27
announcement, rollout pending), several medhasoft scholarships (only secondary corroboration),
Gram Parivahan, Parivarik Labh, Gramin Awas, Alpsankhyak Rozgar Rin, Har Ghar Bijli (saturated),
Pratigya (candidate registration not yet open).

Notable **corrections** (no-misinformation rule):
- **PM SVANidhi** loan tiers raised to ₹15k → ₹25k → ₹50k (2025 restructuring, extended to 2030).
- **PMMY (Mudra)** ₹20 lakh applies only via Tarun Plus (repeat Tarun borrowers), not a blanket ceiling.
- **Ujjwala** subsidy ₹300/cyl for up to 9 refills/yr (FY2025-26); **PMJJBY** premium ₹436.
- **e-Shram** card does NOT auto-provide insurance — it's registration + a gateway (linked schemes need separate enrolment).
- **Pravasi Majdoor** accident benefit doubled to ₹4 lakh (death) per S.O. 75 of 9 Feb 2026.
- **Jananayak Karpoori** is a ₹3,000/yr STATE top-up (₹9,000 combined with PM-KISAN), newly announced 2026-27 — not a ₹9,000 state benefit.
- **Alpsankhyak Rozgar Rin** flat 5% (no separate women's rate); ceiling ₹5 lakh; income ≤₹4 lakh.
- **Kanya Vivah** ₹5,000 (not ₹5,000–₹10,000), paid to the bride by DBT.
- **Bihar Startup Fund** is an interest-free loan (the separate "₹3 lakh grant" could not be officially confirmed → removed).

Structural fixes: renamed **"Shatabdi Niji Nalkoop" → "Mukhyamantri Niji Nalkoop Yojana"** (current
official name); **subsumed "Balika Protsahan (Intermediate)" into Kanya Utthan** (it is that scheme's
intermediate milestone — successor link set) to stop double-listing the same ₹25k benefit. Hard
current-FY signals captured: JJM extended to Dec 2028 (Mar 2026), Vaas Bhoomi campaign 15–21 Jun
2026, Diesel Anudan Kharif window, Bihar Startup portal updated Jun 2026. Seed: `seed/20_verify2.ts`.

## Freshness loop (designed for staleness)

Every scheme/policy carries `last_verified`. The loop that keeps the catalogue honest over time:

1. **Show** — cards and detail pages render "verified N ago" (`lib/dates.ago`).
2. **Flag** — a scheme detail shows an amber "may be outdated" note once `last_verified` is over a
   year old (`lib/dates.isStale`). `npm run data:stale` prints the re-verification queue: every
   entry by age, banded 🟢 fresh / 🟠 due (>180d) / 🔴 stale (>365d). `npm run data:stale -- 180`
   filters to those due.
3. **Re-verify** — on a cadence (target: **quarterly**, and always before a budget-season refresh),
   re-run the verification pass (the parallel-agent method in this log) on the entries `data:stale`
   surfaces, then update `status_evidence` + `last_verified` and reload (`data:load` → `data:dump`).

Baseline: the whole catalogue was verified 2026-06-19/21, so the first re-verification is due
~2026-09 (or sooner for marquee schemes around budget announcements).

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
