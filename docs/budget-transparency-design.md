# Budget-Transparency Module — Definitive Design

*Bihar Policy & Scheme Tracker · top-down sector/department budget view · v2 (red-team-hardened, build-ready)*

> Produced via a multi-agent design workflow: 4-probe research (codebase audit + PRS/Bihar budget
> data reality + sources + prior art) → 4 divergent design candidates → 5-lens adversarial judging
> → synthesis → red-team → reconcile. Designs scored 86–89/100.

## 1. Summary & chosen approach

Build a **new first-class table `sector_budget_lines`**: one fiscal-year budget line = one row,
carrying the **BE / RE / Actual triad as three columns, each with its own provenance + source_url**,
organised as a **sector → sub_head** hierarchy (the `department` middle level exists in the schema
but is **not authored in the MVP** — there is no department data until CAG/OBI in Phase 2). It reuses
the existing `data_provenance` enum verbatim and ports the no-fabrication validation rules from
`scripts/validate-data.ts:57-70`. Ship **Education only** with real, edition-pinned PRS figures; the
other three sectors ship as honest `rti_needed` stubs whose *absence is the finding*.

**Why this shape (the load-bearing trade-off).** The per-stage-provenance column model is the one
structure that lets a single comparable line honestly say "BE ₹70,141 cr [PRS 2026-27, published] ·
RE NULL [awaited] · Actual NULL [rti_needed]" — exactly what the sourcing reality demands: PRS is the
BE/RE spine, CAG is the *separately-sourced, later-arriving* Actuals spine. We **reject reusing
`scheme_metrics`** (its `scheme_id` is `NOT NULL`; a sector total has no scheme) and **reject a
three-row `stage` model** (it cannot attach distinct provenance to BE vs Actual on one logical line
without denormalising). The cost: this is a *third* budget shape alongside `budget_allocations`
(2 cols, no provenance) and `scheme_metrics` (1 figure/row). We accept it and mitigate with a
migration header + `CONTRIBUTING.md` note positioning it as "the top-down twin of `scheme_metrics`."

**What the red-team review changed (all folded in):**
1. **Colour/reuse contradiction resolved** — `BarCell` and `provClass` are *local non-exported
   functions* (`schemes/[id]/page.tsx:605, :443`; `provClass` duplicated at `rti/page.tsx:23`) whose
   bar fill is `bg-brand` (green, magnitude-encoding). Fix: a prerequisite refactor extracts them and
   **changes the bar fill from green to ink/grey** so magnitude is never colour-encoded.
2. **`last_verified` added** — a mandatory CLAUDE.md guardrail the draft dropped (distinct from
   `as_of_date`, the figure's publication date).
3. **PRS-laundering guard strengthened** — a mandatory `prs_edition_fy` field + documented manual
   cross-check; `reported` (never `published`) is forced for any non-Education or non-sector figure
   tagged against a PRS URL (closes the verified Drishti/BPSC "₹60,204 cr" fake-figure trap).
4. **MVP scoped down** — drop the `department` level, recursive `children`/`$ref` YAML, the CSV API
   route, and the `/rti` cross-join from the MVP (each is data-less or blocked until a later phase).
5. **Credibility waterfall gated on having an Actual** — with `actual_cr` null at MVP, render
   "BE → RE · Actuals not yet audited" with the Actual stage as an explicit hatched-absent cell.
6. **pg_dump restore-ordering** for the self-referential FK resolved (deferrable constraint).
7. **OBI URLs annotated** as Cloudflare-blocked / manual-download-only.

---

## 2. Data model

### 2.0 PREREQUISITE refactor (own task, ~half a day — must land before the new pages)

Extract into `components/ui.tsx`:
- **`provClass(p)` → `<ProvenancePill>`** — move out of `schemes/[id]/page.tsx:443` and the dup at
  `rti/page.tsx:23`; both call sites import it. Keep `text-brand` for `published`/`rti_received`
  **only because the pill always renders the text label beside the colour** (colour redundant).
- **`BarCell` → `<BarCell>`** — move from `schemes/[id]/page.tsx:605`. **Change bar fill from
  `bg-brand` (green) to `bg-ink/15` (grey) with the ₹ value as on-bar text** (magnitude by
  length + text, never colour). Update the existing scheme-page call site.
- **`DataImpact` table styling → `<DataTable>`** — shared shell for both pages.

### 2.1 Migration — `supabase/migrations/20260625000000_sector_budgets.sql`

```sql
create type budget_sector as enum ('education', 'skilling', 'industry', 'employment');

create table sector_budget_lines (
  id            uuid primary key default gen_random_uuid(),
  sector        budget_sector not null,
  level         text not null check (level in ('sector','department','sub_head')),
  parent_id     uuid references sector_budget_lines(id) on delete cascade
                  deferrable initially deferred,        -- restore-ordering fix
  label_en      text not null,
  label_hi      text,
  scheme_id     uuid references schemes(id) on delete set null,  -- optional sub_head → registry scheme
  fiscal_year   text not null,
  allocated_cr  numeric check (allocated_cr is null or allocated_cr >= 0),  -- Budget Estimate
  revised_cr    numeric check (revised_cr  is null or revised_cr  >= 0),    -- Revised Estimate
  actual_cr     numeric check (actual_cr   is null or actual_cr   >= 0),    -- audited Actuals (CAG), lags 1-2 FYs
  share_pct     numeric,                                -- % of total state expenditure — sector-level only
  allocated_provenance data_provenance,
  revised_provenance   data_provenance,
  actual_provenance    data_provenance,
  allocated_source_url text,
  revised_source_url   text,
  actual_source_url    text,
  prs_edition_fy text,                                  -- WHICH PRS edition a published figure came from
  is_combined_rev_cap  boolean not null default false,  -- true = mixes Revenue+Capital (PRS does; disclose)
  as_of_date    date,                                   -- the figure's own publication/RTI-receipt date
  last_verified date not null,                          -- when WE last confirmed the live figure (guardrail)
  note_en       text,
  note_hi       text,
  created_at    timestamptz default now()
);

create index sbl_sector_year_idx on sector_budget_lines (sector, fiscal_year);
create index sbl_parent_idx      on sector_budget_lines (parent_id);
create index sbl_scheme_idx      on sector_budget_lines (scheme_id) where scheme_id is not null;
create unique index sbl_identity_idx on sector_budget_lines
  (sector, level, fiscal_year, label_en, coalesce(parent_id,'00000000-0000-0000-0000-000000000000'::uuid));

create table sector_concordance (
  sector         budget_sector primary key,
  concordance_en text not null,
  concordance_hi text
);
```

### 2.3 YAML shape — `data/sector-budgets/<sector>.yaml` (FLAT in the MVP: no nested children)

A `sub_head` names its parent by `parent_label_en` (resolved to `parent_id` at load); it may name a
registry scheme by `scheme_name_en`. Filled example using **verified** figures:

```yaml
# data/sector-budgets/education.yaml
sector: education
concordance_en: >-
  "Education" here = the PRS functional sector "Education, Sports, Arts & Culture", which folds
  Bihar's school-education AND higher-education departments into ONE grouping and combines Revenue
  expenditure + Capital outlay. It is NOT a single department.
concordance_hi: >-
  यहाँ "शिक्षा" = PRS का कार्यात्मक क्षेत्र "शिक्षा, खेल, कला व संस्कृति" — विद्यालय व उच्च शिक्षा दोनों को
  मिलाकर एक समूह, कोई एक विभाग नहीं; इसमें राजस्व + पूँजी व्यय संयुक्त हैं।
lines:
  - level: sector
    label_en: Education, Sports, Arts & Culture
    label_hi: शिक्षा, खेल, कला व संस्कृति
    is_combined_rev_cap: true
    fiscal_year: "2025-26"
    allocated_cr: 63335                 # BE 2025-26 — PRS 2025-26 edition
    allocated_provenance: published
    allocated_source_url: https://prsindia.org/files/budget/budget_state/bihar/2025/Bihar_Budget_Analysis_2025-26.pdf
    prs_edition_fy: "2025-26"
    share_pct: 21.7
    actual_cr: null                      # audited Actuals not yet published
    actual_provenance: rti_needed
    as_of_date: "2025-02-28"
    last_verified: "2026-06-25"
    note_en: Combined Revenue + Capital, per PRS Table 4 "Sector-wise expenditure".

  - level: sector
    label_en: Education, Sports, Arts & Culture
    fiscal_year: "2024-25"
    allocated_cr: 54605                  # BE 2024-25 — from the 2024-25 edition
    allocated_provenance: published
    allocated_source_url: https://prsindia.org/files/budget/budget_state/bihar/2024/Bihar_Budget_Analysis_2024-25.pdf
    revised_cr: 79915                    # RE 2024-25 — published in the FOLLOWING (2025-26) edition. EDITION PIN MATTERS.
    revised_provenance: published
    revised_source_url: https://prsindia.org/files/budget/budget_state/bihar/2025/Bihar_Budget_Analysis_2025-26.pdf
    prs_edition_fy: "2024-25"
    actual_cr: null
    actual_provenance: rti_needed
    last_verified: "2026-06-25"

  - level: sub_head
    label_en: Samagra Shiksha Abhiyan
    label_hi: समग्र शिक्षा अभियान
    parent_label_en: Education, Sports, Arts & Culture
    fiscal_year: "2026-27"
    allocated_cr: 12107
    allocated_provenance: published
    allocated_source_url: https://prsindia.org/files/budget/budget_state/bihar/2026/Budget_Analysis_2026-27-Bihar.pdf
    prs_edition_fy: "2026-27"
    last_verified: "2026-06-25"
```

```yaml
# data/sector-budgets/skilling.yaml — the honest-empty case (PRS prints ZERO numeric lines)
sector: skilling
concordance_en: >-
  "Skilling" = Labour Resources Dept + Bihar Skill Development Mission (KYP, SANKALP). PRS publishes
  NO numeric line for this sector in ANY year — only prose. A figure needs the raw Bihar
  Demands-for-Grants (Demand 26 — vector PDF, no text layer) or an RTI. The absence is the finding.
lines:
  - level: sector
    label_en: Skilling (Labour Resources + Bihar Skill Development Mission)
    fiscal_year: "2025-26"
    allocated_cr: null
    allocated_provenance: rti_needed
    actual_cr: null
    actual_provenance: rti_needed
    last_verified: "2026-06-25"
    note_en: >-
      No PRS sector line for Skilling. Sector total must come from Bihar DfG Demand-26 / CAG
      Labour head (manual extract), or RTI. No published figure to cite yet.
```

(`industry.yaml`, `employment.yaml` follow the same honest-empty pattern — PRS gives only prose.)

### 2.5 Validation rules (added to `scripts/validate-data.ts`, ported per stage)

1. No sourceless number. 2. Awaited provenance carries no figure. 3. A figure must declare
provenance. 4. NULL only for awaited/estimated/untracked. 5. `estimated` needs a note. 6. `actual`
is never `estimated`. 7. `share_pct` is published-sector-only. **8. PRS-laundering guard
(strengthened):** (a) PRS-hosted `published` figures MUST carry `prs_edition_fy` matching the FY in
the URL; (b) `published`-against-PRS allowed **only** for `sector == 'education'` figures — anything
else must be `reported`; (c) emit a `MANUAL-CHECK` stdout line per PRS figure (the validator can't
read the PDF). 9. `scheme_name_en` referential check. 10. `parent_label_en` referential check.
11. `last_verified` present + not future-dated. 12. Sum-sanity warning (children never auto-derive
the parent).

### 2.6 Loader / export / dump
- **load-data.ts** — full-replace per sector (`delete … where sector = $1` then re-insert), two-pass
  (sector rows first, then sub_heads resolving `parent_label_en`/`scheme_name_en`).
- **export-data.ts** — explicit additive block (resolve ids back to labels for lossless round-trip).
- **dump-data.ts** — no change; the `deferrable` FK makes the baked seed restore cleanly.

---

## 3. Data acquisition plan

| Sector | Real today (`published`) | Source + edition pin | `rti_needed` / NULL |
|---|---|---|---|
| **Education** | Sector **BE** FY23-24→26-27 = 42,381 / 54,605 / 63,335 / 70,141 cr; **RE** = 55,111 / 58,378 / 79,915 / 91,254 cr; `share_pct` 21.7%; 1-2 sub-head bullets/yr (Samagra Shiksha ₹12,107 cr 26-27) | **PRS Bihar Budget Analysis** PDFs. **Edition pin (validator-enforced):** each year's BE → same-year edition; each year's RE → the *following* year's edition | Current-FY audited Actuals; elementary/secondary/higher split; per-scheme disbursement; district/demographic splits |
| **Skilling** | *Nothing from PRS.* | — | Sector total + sub-heads → `rti_needed`; OBI Demand-26 is Cloudflare-blocked, manual-download context only |
| **Industry** | *Nothing from PRS* (prose only). | — | `rti_needed` |
| **Employment/IT** | *Nothing from PRS* (Saat-Nishchay-3 prose only). | — | `rti_needed`; per-scheme MNSSBY/KYP lines stay in `scheme_metrics` |

**Verified fabrication trap, neutralised.** Coaching/web sources attribute figures like "Education
₹60,204 cr", "Higher Education ₹8,012 cr", "Industries ₹3,337 cr" to "PRS" — these are **not in any
PRS PDF**. Rules 8a/8b block mis-tagging; the `MANUAL-CHECK` line forces a human to confirm the real
digit (`63,335`, not `60,204`) appears in the cited edition.

**Phase-2 Actuals (CAG)** = an owned **manual extract-and-verify** pass (CAG tables extract with
labels and numbers in separate blocks → need reconstruction + row-level verification, not autoload).
Loaded as `published` + a `cag.gov.in` source. **Never OCR `budget.bihar.gov.in` vector PDFs.**

---

## 4. UI & the honest "impact" surface

**Routes:** `app/[lang]/budget/page.tsx` (sector index — four cards + coverage line) and
`app/[lang]/budget/[sector]/page.tsx` (only `/budget/education` carries real figures at MVP).

**`/budget/[sector]` — four panels:**
1. **Concordance disclosure** (top) — bilingual + `is_combined_rev_cap` badge; pre-empts the
   "that's not the Education Department" misread.
2. **Money over time** — pure inline SVG (the `Timeline.tsx` house pattern). Stage encoded by line
   *style* not colour (solid = Actual, dashed = BE, dotted = RE); direct ₹ label on every point;
   missing Actual = the line stops at an open "RTI needed" circle.
3. **"Did it get spent?" — gated credibility waterfall.** BE → RE → Actual with the grey `<BarCell>`.
   At MVP every `actual_cr` is null, so it renders "BE → RE · Actuals not yet audited (CAG/RTI
   pending)" with the Actual stage as a hatched-absent cell. Utilisation = Actual ÷ BE only when both
   operands are sourced *and same-scope*. Variance shown as sign + word, tinted blue/amber (not
   red/green, CVD-safe).
4. **By sub-head (breakup table)** — shared `<DataTable>`; columns Label · FY · BE · RE · Actual ·
   provenance pills · source.

**Honest-empty framing** for sparse sectors: *"Bihar publishes Education's budget in detail, but not
Skilling's below the department level. That silence is why this page shows an RTI need, not a
number."* + a "draft this RTI" CTA linking to `/rti`.

**Deferred (cut from MVP):** the `/rti` "promise vs proof" cross-join (Phase 3 — `listRtiApplications`
hard-joins on `scheme_id`, which sector rows lack), and the CSV export route (Phase 2).

**Honest impact, ranked:** (1) gated BE→RE→Actual waterfall; (2) utilisation ratio (gated on both
operands sourced + same-scope); (3) `share_pct` trend; (4) nominal YoY %. **Forbidden:** interpolated
Actuals, cross-scope ratios, causal claims, OCR'd budget.bihar.gov.in digits, PRS-tagged figures not
in PRS.

---

## 5. MVP vertical slice + phase plan

**Prerequisite:** the §2.0 component extraction (grey `<BarCell>`, `<ProvenancePill>`, `<DataTable>`).

**MVP:** migration → `lib/types.ts` → flat JSON schema + 12 validation rules → loader/export step →
4 flat YAML files (**Education fully populated from edition-pinned PRS**; other three honest
`rti_needed` stubs) → `lib/queries.ts` (`getSectorLines`, `getSectorConcordance`,
`getSectorYearSeries`) → `/budget` index + `/budget/education` detail → ~10 i18n keys → `SiteNav`
link. **The no-fabrication design *is* the demo.** No department level, no recursive YAML, no CSV
route, no `/rti` cross-join.

- **Phase 2** — CAG Actuals (manual verify pass, Education first) + CSV export.
- **Phase 3** — RTI conversion (`rti_needed`→`filed`→`received`); refactor `listRtiApplications` to
  `UNION` sector rows so they surface in `/rti`; backfill earlier PRS years.
- **Phase 4** — staleness job that **scrapes the PRS Bihar landing page** for the new edition link
  (the PDF filename pattern is NOT stable — 26-27 broke it), never guesses a URL.

---

## 6. Open decisions for the maintainer

1. **Keep `department` level in the schema now, or add in Phase 2?** *Recommendation: keep the CHECK
   value `'department'` (costs nothing) but author zero department rows and ship a flat YAML schema.*
2. **Phase-2 CAG Actuals — accept the manual extract-and-verify cost, or wait for RTI-only?**
   *Recommendation: accept the manual pass for Education only in Phase 2 (~1 day); other sectors stay
   `rti_needed` until RTI replies.*
3. **The `MANUAL-CHECK` PRS-digit gate — blocking in CI or advisory?** *Recommendation: advisory in
   CI log + a required PR-checklist box ("I confirmed each PRS figure appears verbatim in the cited
   edition"). A hard block on a machine-unverifiable condition just trains rubber-stamping.*

---

**Files created / touched:** prerequisite refactor of `components/ui.tsx` + the two call sites;
new migration, JSON schema, 4 YAML files, 2 pages, optional `SectorBudgetChart.tsx`; additive edits
to `lib/types.ts`, `lib/queries.ts`, `scripts/validate-data.ts`, `scripts/load-data.ts`,
`scripts/export-data.ts`, `lib/i18n.ts`, `components/SiteNav.tsx`, `CONTRIBUTING.md`.
