# Education Expenditure & Accountability — Source Discovery

*Bihar Policy & Scheme Tracker · landscape map of where education-spend data lives (and provably doesn't).*
*Research window: 2026-07-10 to 2026-07-12. Every claim carries its source URL, document name, and access date.*
*Method: multi-agent web sweep (5 search angles → 24 sources fetched → 120 claims extracted → top 25 adversarially verified 3-vote, 22 confirmed / 3 refuted) + 6 targeted follow-up investigations for entities the first sweep missed.*

**Verification legend:**
- ✅ **verified** — claim survived 3-vote adversarial verification against the downloaded primary document
- 🔎 **fetched** — page/PDF was actually fetched and read by a research agent; not independently re-verified
- ⚠️ **snippet** — from a search result only; treat as a lead, not a fact

---

## 0. The shape of the landscape (read this first)

Bihar education money is visible online at **two ends** and dark in the middle:

1. **Allocation end (solid).** Budget Estimates, Demands for Grants, and revenue/capital detail
   PDFs on the Bihar Finance Department site, FY 2011-12 → 2026-27. ✅
2. **Audited-actuals end (solid, 1–2 FY lag).** CAG Finance Accounts (function-wise actuals),
   Appropriation Accounts (grant-wise provision vs expenditure), and State Finances Audit
   Reports (SFAR) with scheme-head-level savings analysis. ✅
3. **The middle — release → actual spend — is a documented black hole.** Funds transferred to
   Single Nodal Agencies (BEPC for Samagra Shiksha) are *booked as expenditure at the moment of
   transfer*. The Accountant General received **no vouchers of actual expenditure from SNAs**
   in FY 2022-23 or 2023-24. ₹14,738–15,732 crore lay unspent in SNA bank accounts at each
   year-end. Utilisation Certificates worth ₹70,877.61 crore were outstanding as on
   31 March 2024, with Education, Panchayati Raj and Rural Development the top defaulters. ✅
   **The CAG itself documents that sub-SNA expenditure detail is unavailable — this is the
   spine of the RTI register** (`docs/data-gap-register.md`).

Headline confirmed numbers that anchor the module:

| Fact | Figure | Source (✅ all verified) |
|---|---|---|
| Education Dept = Grant No. **21**, largest grant in the state budget | FY23 provision ₹55,892.37 cr | CAG SFAR 2022-23, Table 3.16 |
| Chronic underspend on Grant 21 | 23–25% unspent every year 2018-24 | CAG SFAR 2022-23 App. 3.5/Table 3.9; SFAR 2023-24 Tables 3.21-3.22 |
| Samagra Shiksha unspent (head 21-2202-01-111-0201), 2021-24 | ₹11,628.11 cr = 58.10% of ₹20,013.18 cr | CAG SFAR 2023-24, Table 3.28 |
| PM POSHAN unspent (head 21-2202-01-112-0203), 2021-24 | ₹2,969.43 cr = 57.85% of ₹5,132.78 cr | CAG SFAR 2023-24, Table 3.28 |
| General Education audited actuals FY 2023-24 | ₹44,783.71 cr (rev 40,192.85 + cap 2,987.77 + loans 1,603.09) | Finance Accounts Vol I 2023-24, Statement 4 |
| Unspent in SNA bank accounts, 31 Mar 2024 | ₹14,738.13 cr (of ₹31,145.19 cr transferred in FY24) | Finance Accounts Vol I 2023-24 Note (xviii); SFAR 2023-24 Para 4.19 |
| UCs outstanding, 31 Mar 2024 | ₹70,877.61 cr (49,649 UCs); Education ₹12,623.67 cr | SFAR 2023-24 Table 4.5 |

**Known internal contradiction (do not silently resolve):** within SFAR 2023-24, Grant-21 FY24
expenditure is ₹42,157.67 cr per Table 3.21 (Department/DfG series) but ₹40,923.02 cr per
Appendix 3.4 (Appropriation Accounts series) — a ₹1,234.65 cr disagreement between two series
inside the same CAG report. Model both; never average them. ✅

---

## 1. State budget documents (allocation side)

### 1.1 Bihar Finance Department — Budget section ✅ verified
- **Where:** https://state.bihar.gov.in/finance/SectionInformation.html?editForm&rowId=3373
  ("Finance Department - Budget"). Accessed 2026-07-10/11.
- **What:** FY-wise consolidated **"Demands For Grants"** PDFs, **Annual Financial Statement**,
  **Revenue Expenditure-I/II (Detail)**, **Capital Expenditure (Detail)**, **Demand-wise
  Expenditure (Detail)** — hosted under `/cache/12/Budget/` (current year) and
  `/cache/12/Old-Budgets/` (confirmed back to **2011-12**; 2008-09→2010-11 folders 404).
- Current-year example (fully downloaded, 31.1 MB, JasperReports-generated Jan 2026):
  `Demands For Grants_Report_2026-27.pdf` —
  https://state.bihar.gov.in/finance/cache/12/Budget/Budget/Demands%20For%20Grants_Report_2026-27.pdf
- All PDFs download without authentication. **These are the BE-side spine for `programme_allocations.approved_*`.**
- ⚠️ Caveats: per prior project experience the budget PDFs can be vector-drawn without a
  reliable text layer (never OCR-and-trust; manual extract-and-verify per figure). Economic
  Survey 2022-23/2023-24 links on the same page are served via **Google Drive URLs** and some
  Appropriation Act circulars are dead `javascript:void(0)` links 🔎 — citation-stability risk.
- 🔎 **CFMS 2.0 lead:** FY 2026-27 budget preparation is done in "CFMS 2.0" (Comprehensive
  Financial Management System) per a training notice on the Finance homepage — transaction-level
  allotment/expenditure sits inside CFMS, not in public documents → RTI target.

### 1.2 budget.bihar.gov.in — status unresolved; practically empty 🔎
- The relaunched portal (footer "Last Updated: 03 March, 2025", built by CIPHERSPHERE
  INNOVATIONS PVT LTD) rendered **zero downloadable budget documents** on its View Budget
  Details / Archive pages when fetched 2026-07-10, and its TLS certificate expired 2026-03-02
  (reachable only with certificate checks disabled).
- BUT: adversarial verification **refuted** both the strong claim "it is empty" (1-2) and the
  opposite claim "detailed data lives there" (0-3). Treat the domain as **unresolved**; the
  Finance Department PDF pages (§1.1) are the only *verified* budget source. Re-check after the
  next budget session.

### 1.3 PRS Legislative Research (secondary spine) 🔎
- Bihar Budget Analysis 2025-26: Education, Sports, Arts & Culture BE 2025-26 = ₹63,335 cr
  (21.7% of total expenditure); 2024-25 RE ₹79,915 cr; 2023-24 actuals ₹43,878 cr; sub-lines
  ₹13,421 cr school salaries assistance, ₹5,584 cr assistance to universities.
  https://prsindia.org/files/budget/budget_state/bihar/2025/Bihar_Budget_Analysis_2025-26.pdf (accessed 2026-07-10)
- PRS names **no schemes** (no Samagra/POSHAN/KYP/BSCC lines) — scheme-level must come from DfG
  or CAG. Grants-in-aid from Centre FY24: ₹26,125 cr actual vs ₹53,378 cr budgeted (-51%).
- Edition-pinning discipline per `docs/budget-transparency-design.md` applies (BE from
  same-year edition, RE from following year's edition).

---

## 2. CAG — the actuals & accountability pillar ✅ (all verified against downloaded PDFs)

### 2.1 Portals
- **AG (Audit) Bihar report index:** https://cag.gov.in/ag/bihar/en/audit-report — 69 Bihar
  reports, filterable by type/sector/year; PDFs free, stable pattern
  `cag.gov.in/uploads/download_audit_report/{year}/…`. Latest SFAR: **Report No. 1 of 2025**
  (FY 2023-24), tabled 24 July 2025. Reports confirmed back to FY 2015-16. Accessed 2026-07-10/11.
- **State Accounts (Finance + Appropriation Accounts):**
  https://cag.gov.in/en/state-accounts-report?defuat_state_id=67 — Appropriation Accounts FY
  2021-22 → **2024-25**; Finance Accounts Vol I + II FY 2021-22 → 2024-25; Monthly Key
  Indicators from Apr 2021 (within-year expenditure proxy). "All Grants 2023-24" compilation is
  an external SharePoint link. Server intermittently slow. Accessed 2026-07-10.

### 2.2 Key documents for this module
| Document | What it gives the graph | URL |
|---|---|---|
| SFAR 2023-24 (Rep. 1/2025) | Grant-21 provision vs expenditure; Table 3.28 head-wise CSS savings; SNA para 4.19; UC Table 4.5 | https://cag.gov.in/uploads/download_audit_report/2025/State-Finance-Report-2023-24-(08-04-2025)-ENGLISH-FINAL-with-Signeture-FINAL-FOR-PRINT-06881e24daadd66.83179080.pdf |
| SFAR 2022-23 (Rep. 1/2024) | Same series FY23; GoI release table (Samagra Elem ₹1,445.14 cr + Sec ₹1,358.84 cr in FY23); SNA para 4.21 | https://cag.gov.in/webroot/uploads/download_audit_report/2024/State-Finance-Report-2022-23-(ENGLISH)-066a229e6b84881.48517440.pdf |
| Finance Accounts Vol I 2023-24 | Statement 4 function-wise actuals; Note (xviii) SNA; Statement 4-B Scholarship/Stipend ₹4,537.31 cr; Statement 12 education loans +₹1,551.99 cr → ₹5,304.14 cr o/s (BSCC channel) | https://cag.gov.in/uploads/state_accounts_report/account-report-Finance-2023-24-Vol-I-Bihar-English-067e4ed3e544e15-90011438.pdf |
| Finance Accounts Vol I 2022-23 | Same series FY23 (Gen Edu ₹43,699.55 cr; Scholarship ₹5,679.23 cr; SNA ₹15,732.06 cr unspent) | https://cag.gov.in/uploads/state_accounts_report/account-report-Finance-Vol-I-2022-23-English-09-12-2023-065e01c767cb444-27138595.pdf |
| **Finance Accounts Vol II** (per-year) | **The scheme-level online location:** Appendix III grants-in-aid institution-wise & scheme-wise (pp. 347-400 in FY24 ed.); Appendix V Scheme Expenditure CSS+State (pp. 403-462); Appendix VI direct GoI→agency transfers bypassing state budget (unaudited; ₹24,305.18 cr in FY23); Statement 18 scheme-wise loans (BSCC) | linked from the State Accounts page above |
| CAG Rep. 1 of 2020 (GSES, FY2018) | Para 3.7: BEPC EdTech precedent — ₹1.98 cr child-record digitisation (2012-15) unfruitful + ₹1.76 cr SDMIS; Para 3.3 Banka scholarship defalcation ₹2.89 cr; Para 3.1 FFC PRI grants forfeited | https://cag.gov.in/webroot/uploads/download_audit_report/2018/GS%20&%20ES%20-%20English%20-%20Report%20for%20the%20year%20ended%20March%202018-06059d8814dea38.05888651.pdf |

### 2.3 What CAG does NOT give
- No standalone education performance audit among recent reports (2023-25 performance audits
  cover health/housing/transport) 🔎 — education findings sit inside combined
  Compliance Audit (Civil) volumes, which lag ~3 years (latest tabled 26 Feb 2026 covers only
  to FY 2022-23).
- CAG tables extract badly (labels/numbers in separate PDF blocks) — the Phase-2 lesson from
  `docs/budget-transparency-design.md` stands: manual extract-and-verify only.

---

## 3. The SNA / UC black hole (release → spend) ✅

This is the single most important structural fact for the schema's `released_*` vs `spent_*` split:

- CSS funds (Samagra Shiksha via **BEPC as Single Nodal Agency**) are **booked as "expenditure"
  when transferred** to the SNA's bank account.
- FY 2022-23: ₹36,422.31 cr transferred (Centre ₹22,231.91 + State ₹14,190.40); **₹15,732.06 cr
  unspent** in SNA accounts on 31 Mar 2023; 113 SNAs → 4,999 child agencies; State share
  ₹2,258.37 cr not released proportionately.
- FY 2023-24: ₹31,145.19 cr released to SNAs (Centre ₹18,173.89 + State ₹12,971.30, per PFMS);
  **₹14,738.13 cr unspent** on 31 Mar 2024; 142 SNAs → 1,75,494 child agencies (PFMS 26.08.2024).
- **AG received no vouchers of actual expenditure from SNAs in either year** (finding appears
  independently in 4 documents). Unspent balances are self-reported via PFMS, "under
  reconciliation", and include prior-year carryover.
- UC pendency: 31 Mar 2023 — 41,755 UCs / ₹87,947.88 cr outstanding, Education the largest
  defaulter (₹26,692.78 cr). 31 Mar 2024 — 49,649 UCs / ₹70,877.61 cr; Panchayati Raj
  ₹28,154.10 cr, Education ₹12,623.67 cr (drop reflects bulk UC *adjustment* of ₹1,09,093.32 cr
  during 2022-23, **not verified spending**), Rural Development ₹7,800.48 cr.
- CAG's own words: *"To the extent of non-submission of UCs, there is a risk that the amount
  shown in Finance Accounts may not have reached the beneficiaries."*

**Modelling consequence:** `spent_cr` at programme level must never be inferred from treasury
"expenditure" figures for SNA-routed schemes; those are `released_cr`. True spend below the SNA
is `rti_needed` until a UC/audited BEPC account/RTI reply says otherwise.

---

## 4. Central approvals & releases (Samagra Shiksha, PM POSHAN)

### 4.1 Samagra Shiksha PAB minutes 🔎 (fetched, multiply-corroborated)
- **Canonical home:** https://dsel.education.gov.in/en/pab-minutes → 301-redirects to
  https://www.dsel-education.gov.in/en/pab-minutes. Accessed 2026-07-10/11.
- FY collections **2016-17 → 2026-27**; Bihar-specific minutes for ≥11 annual PAB meetings
  (doc dates 2016-04-28 … 2026-06-29) plus addenda (2025-07-03, 2026-01-06) and pre-Samagra
  SSA-era Bihar docs (2015-16, 2016-17).
- Bihar FY 2026-27 minutes: published 2026-07-01, PDF live (HTTP 200, 1.18 MB, 79 pp):
  https://www.dsel-education.gov.in/static/uploads/2026/07/18482f30805167be96abc606576d8c2d.pdf
- **Access barriers:** page is a client-rendered Next.js app (403 to non-browser agents); the
  document list is served by a WordPress REST API
  (`https://www.dsel-education.gov.in/cms/wp-json/custom/api/search?s=bihar`) — target the API
  for automated tracking. The Bihar 2026-27 PDF is a **scanned image with no text layer**
  (Producer "iLovePDF") — figures must be OCR'd/manually read, or the digital original sought via RTI.
- **This is the `approved_*` source for Samagra rows** (component-wise, incl. teacher training).

### 4.2 PRABANDH (Samagra Shiksha MIS) 🔎
- https://prabandh.education.gov.in/ — "Project Appraisal, Budgeting, Achievements and Data
  Handling System". Contains exactly the allocation-vs-release-vs-expenditure reports we want
  (approval-and-expenditure, all-state budget outlay, DBT reports, **DIET fund management**) —
  all `makeSecure:true` login-gated routes; anti-devtools scripts; React SPA serving an empty
  shell. **Confirmed not publicly accessible → RTI target** (accessed 2026-07-10/11).

### 4.3 PM POSHAN PAB minutes — currently OFFLINE 🔎
- Designated venue pmposhan.education.gov.in returns **HTTP 500 site-wide** (Microsoft-IIS/10.0,
  content-length 0) on 2026-07-10 and 2026-07-11.
- Bihar PAB 2024-25 minutes (meeting 30.08.2024; F.No.16-4/2024-PMP-1 dated 17.09.2024): the
  only Wayback capture (2025-02-19) is truncated at 1,048,576 of 2,479,065 bytes — just the
  2-page scanned cover letter survives.
- Approved figures **recovered via search-engine index of the PDF, NOT byte-verified**: central
  assistance ₹1,39,757.83 lakh + 324,227.06 MT foodgrains; minimum mandatory state share
  ₹81,943.06 lakh; 2,45,316 cook-cum-helpers proposed with a ₹650/month state top-up honorarium.
  → load as `reported` provenance at best, or leave null; re-verify when the portal returns / via RTI.

### 4.4 GoI release figures (CAG-audited cross-check) ✅
- FY23: Samagra Elementary ₹1,445.14 cr + Samagra Secondary ₹1,358.84 cr (+2,566% YoY).
- FY24: Samagra Elementary ₹3,334.59 cr (+130.74%); Secondary **zero**.
- New India Literacy Programme heads fully unspent FY24 (₹18.83 cr + ₹12.27 cr); RUSA/PM-USHA
  capital head 4202-01-203-0207 (₹15.20 cr) fully unspent.

---

## 5. Procurement & tenders

### 5.1 eproc2.bihar.gov.in ("Eproc2.0 Govt. of Bihar") 🔎 (fetched, multiply-corroborated)
- Current official e-procurement portal; **BSEDC/BELTRON is the nodal agency**, supported by
  mjunction; legacy portal still live at https://www.eproc.bihar.gov.in/BELTRON (pre-migration
  tenders live only there); CPPP (eprocure.gov.in) cross-linked. Accessed 2026-07-10/11.
- Public open-area listing (no login):
  https://eproc2.bihar.gov.in/EPSV2Web/openarea/tenderListingPage.action — 807-808 live tenders
  on access dates; department filter + date/category facets; tabs incl. Past/Cancelled/Corrigendum.
- **All in-scope entities are registered tendering departments** (dept master via
  `/rest/organization/getChildOrgUnderProvidedOrgID?orgId=538`, 149 departments): EDUCATION
  DEPARTMENT (id 1563), Bihar Education Project Council (1520), SCERT Bihar (2385), BSEB (1518),
  BIPARD (2057), Dept of IT (2823), BSEDC/BELTRON (1345), Panchayati Raj (1907), Rural
  Development (2841), PM POSHAN/BRMBYS (2043), Youth Employment & Skill Development (3039).
- **What's NOT public:** no value column in listings; per-tender "Estimated Value in INR"
  (`pacamt`) can be masked by a per-tender visibility flag (observed: BEPC KGBV tender id 134185,
  ref KGBV/Tender/2026-27/01, pacamt masked); the "Awarded PO Details" endpoint
  (`/rest/openarea/getPoDetailsForPastTender`) returned **empty for all 40 newest archived
  tenders probed** → awarded vendor + award value effectively not available online. MIS-report
  links are commented out of the page source. REST endpoints reject non-browser calls
  ("Expected Fishing or Hacking attack"); TLS chain incomplete. **Tender value+vendor = RTI.**

### 5.2 BEPC tenders page 🔎 (fetched, multiply-corroborated)
- https://www.bepcssa.in/en/tenders.php — live, ~70-100+ tender/RFP PDFs spanning 2022-2026
  (latest observed 24-06-2026). BEPC confirmed as Samagra Shiksha SNA (bepcssa.in/en/about.php).
- EdTech procurement evidence (titles/refs only — **no values, no vendors, no LoAs published**):
  - **ICT Labs on BOOT model in 4,465 govt schools** (RFP 3824)
  - **e-Shikshakosh "District Cells" in all 38 DEO offices** (ref 73406924)
  - **Vidya Samiksha Kendra System Integrator** (ref BEPC/VSK/2025-26-2424, dated 04-06-2025)
  - **Facial-recognition attendance system** (e-Tender No. 53309)
  - Teacher tablets; smart classrooms; Student Learning Kits (RFP 4091, 01.09.2025);
    Block ICT Coordinators for 534 blocks + 3 urban units; PM SHRI implementation partner
    (20.01.2026); KGBV supplies
- **BEPC Annual Reports 2021-22 and 2022-23 are linked as PDFs** on the same page — the best
  online lead for BEPC-level audited spend. Related portals: tracker.bepcssa.in (login),
  bepclots.bihar.gov.in (e-LOTS). Tender docs reference **GeM bids** → award values may live on GeM.

### 5.3 BSEDC/BELTRON own site 🔎
- https://bsedc.bihar.gov.in — E-Procurement page is one descriptive paragraph, zero tender
  data; own tenders under /en/tenders/current-tenders + /en/tenders/archived-tenders (no values
  or vendors exposed); ERP at bsedcerp2.bihar.gov.in; parent Dept of IT (dit.bihar.gov.in);
  links Jaankari RTI portal (jaankari.bihar.gov.in). eTendering service providers: KEONICS +
  Antares Systems (legacy arrangement; copyright meta 1988-2023, stale). Accessed 2026-07-10/11.

---

## 6. Denominators: UDISE+ 🔎 (fetched twice, figures agree)

- UDISE+ 2024-25 booklet (PDF created 2025-08-28; cutoff 31.03.2025):
  https://dashboard.udiseplus.gov.in/report2026/static/media/UDISE+2024_25_Booklet_existing.118ba29d4773e6372f72.pdf
- Bihar (Table 2.2): **94,339 schools · 21,133,228 enrolments · 707,516 teachers**; PTR 30;
  1,865 single-teacher schools (175,500 students).
- ICT denominators: functional computers in **22,410 / 94,339** schools (23.8%; govt schools
  15.7% = 11,970/76,320 vs all-India 57.9%, Table 7.10); **functional ICT labs in only
  4,871 / 38,355** eligible govt schools (12.7%, Table 9.9) — the baseline against which the
  4,465-school BOOT ICT-lab procurement (§5.2) should be tracked.
- Aadhaar seeding: 16,672,148 / 21,133,228 (78.9%) vs 89.4% national (Table 2.6) — DBT constraint.
- **No financial tables anywhere in the 189-page booklet** — UDISE+ is denominators only.
- Data chain of custody ends at the State Project Director, Samagra Shiksha = BEPC.
- Caveat: indicators not comparable with pre-2022-23 editions (NEP student-wise switch).

---

## 7. Scheme portals & DBT (state side)

### 7.1 Medhasoft (scholarship/DBT) 🔎 (fetched 3×, consistent)
- https://medhasoft.bihar.gov.in/ — live, Education Dept portal, built/maintained by
  **NIC Bihar State Centre** (not BELTRON); payments routed via **PFMS**. Accessed 2026-07-10/11.
- Administers the CM incentive schemes: Kanya (Snatak) Protsahan, Balak/Balika (Madhyamik)
  Protsahan, Kanya Utthan (+2 Balika Protsahan), Medhavriti (SC/ST girls +2). 2026 cycle open.
- **Public data = per-beneficiary payment-status lookup only** (district→school→class drill-down,
  sessions 2024-25 & 2025-26; per-school Excel export exists). District-wise/block-wise reports
  exist but the "Official Reports" section is behind a Department Login
  (medhasoft.bihar.gov.in/officialreports/deptLogin.aspx). **No aggregate FY-wise
  allocation/disbursement figures anywhere public → RTI.**

### 7.2 7-Nishchay Yuva Upmission portal (BSCC / KYP / MNSSBY) 🔎 (fetched 2×)
- https://www.7nishchay-yuvaupmission.bihar.gov.in/ — official application portal for the three
  schemes; delivery via DRCCs + SPMU (spmubscc@bihar.gov.in). Accessed 2026-07-10/11.
- **Dashboard statistics fields render EMPTY** (Total Applications Received/Approved/Rejected,
  gender/category splits — headings present, values unpopulated). **No financial data at all.**
- BSCC loan operations route to **BSEFCL** (bsefcl.bihar.gov.in; Finance-Dept banner links
  educationbihar.gov.in/StudentCreditCard.aspx) → BSEFCL is the record-holder for BSCC money.
  The state portal also advertises a "7 Nishchay dashboard" claiming physical+financial progress
  — needs separate verification. ⚠️
- Accounting cross-check: BSCC lending shows up as Education-sector Loans & Advances in Finance
  Accounts Statement 12 (₹3,752.15 cr → ₹5,304.14 cr outstanding over FY23-24); scheme-wise
  detail in Vol II Statement 18. ✅

### 7.3 RGSA (PRI elected-rep training) 🔎
- Scheme: "Centrally Sponsored Scheme of Revamped Rashtriya Gram Swaraj Abhiyan", approved
  13.04.2022, implementation 01.04.2022–31.03.2026 (past its stated end — continuation status
  unverified), total ₹5,911 cr (Centre ₹3,700 / States ₹2,211), **60:40** for Bihar.
  Portal https://rgsa.gov.in/ (homepage stale: "Last Updated 07 Jan 2022"). Accessed 2026-07-10/11.
- **Bihar FY-wise RGSA releases ARE online** — MoPR Annual Report 2025-26, **Annexure-IV**:
  ₹33.37 cr (2022-23), ₹25.00 cr (2023-24), **₹0.00 (2024-25)**, ₹25.00 cr (2025-26 to
  31.12.2025). **Annexure-V** trained participants: 404,406 / 163,809 / 435,896 / 129,690.
  (PDF modified 2026-02-24.)
- rgsa.gov.in hosts report modules (Action Plan, Quarterly Progress, Plan Status, Training
  Category) + dashboards (TMP at trainingonline.gov.in, eGramSwaraj) but **no state-wise rupee
  tables on the page**; its SIRD training-partner roster **does not list Bihar**; the
  SIRD-Bihar/BIPARD-level split of RGSA training spend is not published → RTI.
- 15th FC grants to Bihar RLBs (same MoPR report): 2025-26 allocated ₹4,012 cr, released
  ₹2,002.52 cr to 31.12.2025 (prior years: 5,018/5,018 · 3,884/3,855.33 · 4,114/4,109.01).

### 7.4 BIPARD 🔎 (fetched 2×)
- https://bipard.bihar.gov.in/ — "Bihar Institute of Public Administration & Rural Development",
  Gaya (WALMI campus) + Patna centre. React SPA (content via API base
  bicta.bihar.gov.in/api/v1/). Accessed 2026-07-10/11.
- **Zero financial content**: "budget", "expenditure", "annual report", "tender", "audit" occur
  nowhere in the 407 KB app bundle. RTI page has no Section 4(1)(b) proactive disclosure and no
  PIO details. Tender notice links out to eproc2. **No mention of SIRD, RGSA, or panchayat
  training anywhere in the bundle** — BIPARD's role in elected-rep training is not documented
  on its own portal → RTI.

---

## 8. Entities investigated in the follow-up pass

> Six targeted investigations (2026-07-12) for entities the first sweep never fetched. All complete.

### 8.1 SCERT Bihar + DIETs + NISHTHA (investigated 2026-07-12)

**SCERT Bihar** 🔎
- Official: **State Council of Educational Research and Training, Bihar** (राज्य शिक्षा शोध एवं
  प्रशिक्षण परिषद्, बिहार), Mahendru, Patna 800006. Live portal: **https://scert.bihar.gov.in/**
  (fetched, HTTP 200). Dead/false domains: biharscert.in (DNS dead, legacy),
  scertbihar.co.in (broken TLS, "Coming Soon"), scertbihar.cyberica.in (dead vendor copy);
  scertdesmbihar.in is a real but niche exhibition microsite.
- **Zero financial disclosure**: no budget/annual report/accounts section anywhere; only
  finance-adjacent item is a "Tender cancellation letter" (no values). RTI page gives
  **PIO Dr. Emteyaz Alam**, FAA = Director, SCERT — but no Section-4 proactive disclosure.
  (Homepage names Director Sajjan R., RTI page names Vinod Kumar Singh — one page is stale.)

**DIETs** 🔎
- **37 DIETs** listed district-wise on SCERT's own list (https://scert.bihar.gov.in/list-diet)
  vs **33 "Functional DIETs"** per PAB minutes 2021-22 (+4 functional BITEs) — reconcile via
  RTI. PAB 2021-22 also: DIET academic vacancy **52.37%** (393 of 825 posts), SCERT vacancy 62.22%.
- Only ONE DIET publishes financials: **dietdarbhanga.com** has a Balance Sheet, Income &
  Expenditure and Receipt & Payment report + works tenders (fetched). dietpatna.in has none.

**The teacher-training money trail (best single find of this pass)** 🔎
- **BEPC hosts Bihar PAB minutes + costing sheets for 2018-19 → 2021-22** at
  https://www.bepcssa.in/en/samagra-awpb.php. The 2021-22 minutes PDF (7.9 MB, MoE
  F.No. 12-1/2021-IS-15, meeting 15.06.2021) was downloaded and text-extracted — verified figures:
  - Total Bihar AWP&B 2021-22 estimate **₹775,106.576 lakh** (Elementary ₹722,310.33 L,
    Secondary ₹52,014.764 L, **Teacher Education ₹781.479 L**).
  - **"Strengthening of Teacher Education" ₹499.70 lakh** itemised: SCERT Assessment Cell ₹35 L;
    **DIKSHA digital content ₹38.7 L**; Programme & Activities ₹390 L (33 DIETs @ ₹10 L +
    research @ ₹1 L each; SCERT ₹25 L + ₹2 L); Annual grants ₹36 L (33 DIETs @ ₹1 L, 4 BITEs
    @ ₹0.5 L, SCERT ₹1 L).
  - **NISHTHA 2.0 (secondary) online training: ₹400.86 lakh @ ₹1,000/teacher** for 40,086
    teachers, reimbursement-basis (pen-drives, module printing, data packs).
  - Fund-flow rule: single "Samagra Shiksha" head in the state DfG; state chooses the SCERT/DIET
    flow (e.g., directly via treasury).
- **NISHTHA Bihar count**: "more than 4 lakh teachers and school heads enrolled and certified"
  under NISHTHA 1.0+2.0 — SCERT Bihar's own deck hosted by CIET-NCERT
  (ciet.ncert.gov.in "Presentation for CIET final.pdf", extracted; undated ~2022-23). No spend figures in it.
- NCERT training portals **down** on access date: itpd.ncert.gov.in (ECONNREFUSED),
  nishtha.ncert.gov.in, samagra.education.gov.in (timeouts). diksha.gov.in is up but a JS shell.
- CBGA "Budgeting for School Education in Bihar" (Mar 2019, fetched): teacher education =
  **0.23%–1.55% of Bihar's school-education budget** across 2014-18 — proves the SCERT/teacher-ed
  lines are visible in the Detailed Demand for Grants volumes (which are themselves hard to obtain online).

**PAB-minutes availability conflict (recorded, not resolved):** an indexed MoE URL for recent
Bihar minutes (`dsel.education.gov.in/sites/default/files/pab/BR_PAB_2025_26.pdf`) is now
**404**, and BEPC's mirror stops at 2021-22 — while the first sweep verified the Bihar
**2026-27** minutes PDF live (HTTP 200) at a `www.dsel-education.gov.in/static/uploads/…` URL
(§4.1). Net: recent minutes ARE online but only via the new site's static-upload URLs /
WP-REST API discovered browser-side; old deep links are dead.

**RTI candidates from this section:** SCERT annual accounts (5 yrs) + Section-4 disclosure;
Grant-21 head-wise BE/RE/Actuals for SCERT/DIETs/teacher training; PAB minutes 2022-23→2025-26
copies (from BEPC/DSEL); actual utilisation vs the ₹499.70 L teacher-education approval;
DIET-wise releases & utilisation (₹10 L/₹1 L/₹1 L grants) + balance sheets; functional-vs-listed
DIET reconciliation; NISHTHA phase/district-wise completion + actual ₹1,000/teacher
reimbursements; DIKSHA content spend actuals + vendor; SCERT tender awards.
### 8.2 BSDM / Kushal Yuva Program / Youth-Employment-Skill Dept (investigated 2026-07-12)

**Identity & parent department — reorganisation caught mid-flight** 🔎
- "Bihar Skill Development Mission (BSDM)", Niyojan Bhawan, Bailey Road, Patna. Through at
  least June 2025 it sat under the **Labour Resources Department** (its own RFP covers say so:
  "Secretary, Labour Resources Department -cum- CEO of BSDM"; RFPs of 22.01.2025 & 03.06.2025,
  fetched via mirrors).
- The **Youth, Employment and Skill Development Department (YESD)** — "established on 10th
  December 2025 by Cabinet resolution", work allocation includes BSDM — verified on its portal
  page (state.bihar.gov.in/yesd/, orgId 56, fetched via curl+cookies; Secretary Kaushal
  Kishore, IAS). (Same Dec-2025 cabinet round as the Higher Education Dept, §8.3 — the two
  reorganisations both postdate most published data; model with `parent_agency_id` transitions.)
- **Portal migration**: skillmissionbihar.org **301-redirects to
  www.biharskilldevelopmentmission.in** — an Angular SPA whose public API
  (api.biharskilldevelopmentmission.in) lists KYP as scheme id 1 but **returns all-zero
  learner statistics** (queried 2026-07-12). The old site's tender archive now 404s.

**Money & norms (mostly via Wayback of the old official site)** 🔎
- **Cost norms (official BSDM document, archived)**: KYP training cost **₹34.7 per candidate
  per hour** (240-hr course ≈ ₹8,328/candidate), minus a **₹900/candidate portal-usage fee**
  retained by BSDM; domain skilling ₹40.4/34.7/28.9 per hr by category ("FY 2016-17" base,
  escalating 5-10%/yr; Amendments 1-3 archived but unfetched; later rates ₹46.70/40.00/33.40 ⚠️).
- **Budget head**: BSDM/KYP money flows under **Grant No. 26 — Labour Resources** (through
  FY24): CAG SFAR 2023-24 Appendix-3.4 — FY24 provision ₹855.07 cr (₹834.69 + ₹20.38 suppl.),
  **expenditure ₹642.49 cr, savings ₹212.58 cr (24.86%)** — a large-savings grant. Post-YESD
  demand number not yet ascertainable online. (Consistent with the honest-empty "Skilling"
  finding in `docs/budget-transparency-design.md` — PRS publishes no skilling sector line.)
- **No CAG para names BSDM/KYP**: full-text grep of SFAR 2023-24 + Finance Accounts FY23/FY24
  found zero occurrences of "Kushal"/"Skill Development Mission".
- Tender money figures published are process-level only (EMD ₹50,000; PG ₹1,00,000/centre;
  fees) — **no estimated contract values, no awards**. Tenders run through eproc2 (per the
  RFPs themselves); no GeM evidence.

**PMKVY in Bihar (central scheme ≠ state KYP)** 🔎
- The one hard, *audited* Bihar skilling number — **CAG Performance Audit of PMKVY, Report
  No. 20 of 2025** (PA-Civil, period 2015-2022, tabled Parliament Dec 2025): of **₹36.82 cr
  released to Bihar, only ₹5.96 cr (16%) utilised by March 2024** (no training centres, no
  skill-gap study, Covid); **3 of 10 sampled Bihar training centres closed** at survey.
  Corroborated across CAG's own press brief (cag.gov.in/uploads/PressRelease/PR-Press-Brief-Report-No-20-of-2025-English-….pdf)
  + ThePrint 25.12.2025 (fetched); byte-verify the main report PDF before loading (CAG server
  refuses programmatic fetch, §9).

**KYP counts** 🔎
- **Official cumulative (archived KYP page, as of 27.08.2024): 25,64,803 admissions**, 1,875
  approved centres, launched 16.12.2016 (48 centres/1,978 learners), 534 blocks/38 districts.
  Gone from the live SPA. "32 lakh enrolled / 25 lakh certified" circulates ⚠️ snippet-only.
- Bihar Economic Survey 2024-25: official PDF URL now 404; Wayback copy truncates — KYP
  figures unverifiable this pass.

**Accountability surface** 🔎
- **No annual reports, no audited accounts, no targets-vs-achievements, no SDC payment data**
  on old or new portal. Old RTI page had generic Act text, no PIO, no Section-4 disclosure.
- The old site's tender archive (Wayback) shows BSDM commissioned a **Social Audit of KYP**
  and an **Impact Evaluation** (agency-selection RFPs existed) — **neither report is online**.

**RTI candidates from this section:** BSDM audited accounts + annual reports; FY-wise
allocation vs expenditure by scheme (KYP/domain/RPL); KYP FY-wise + district-wise
enrolled/certified/placed; payee-wise SDC payments; current post-amendment cost norms; the KYP
social-audit and impact-evaluation reports; eproc2 award values 2016→; SNA/fund-flow + UCs
under Grant 26; the new YESD demand number + the BSDM transfer GO; portal-fee income
(₹900/candidate) collections; governing-body minutes; Bihar PMKVY release-vs-utilisation series
+ training-centre-wise status underlying CAG Report 20/2025.
### 8.3 BSEB + Higher Education wing / universities / PM-USHA (investigated 2026-07-12)

**BSEB (Bihar School Examination Board)** 🔎
- Official portal biharboardonline.bihar.gov.in — unreachable from the research network on
  access date (ECONNRESET/HTTP 000; possibly geo-restricted); verified via **Wayback snapshot
  2025-11-30**: full menu has Circulars/Tenders/E-Tendering/RTI/results — **no annual report,
  accounts, budget, or audit section anywhere**; /tender page = notices only (PR-series),
  no award values; /rti page = Act text only, no Section-4 disclosure.
- The state portal's official BSEB organisation link points to secondary.biharboardonline.com —
  which is an **expired-cert, parked "Domain Default page"** (dangling official link).
- Finances only visible through political noise ⚠️: Amar Ujala 29.06.2026 (fetched) — MP
  Sudhakar Singh demanded a probe alleging BSEB's annual budget grew **~₹10 cr → ~₹700 cr**
  post-2017 with **no independent financial audits or public audit reports**, questioning
  vendor selections (Innovative View, TCS iON, BELTRON) and an ED investigation. No CAG audit
  of BSEB located. **BSEB accounts = RTI.**

**Higher education structure — load-bearing update** 🔎
- Bihar cabinet approved a **separate Higher Education Department on 09.12.2025** (The Week
  wire, fetched; corroborated ⚠️ shiksha.com). The state portal's department dropdown now
  lists "Higher Education Department" (**orgId 58**) separately from "Education Department"
  (orgId 18) — verified in fetched HTML. Previously a Directorate under the Education Dept.
- **The new department has no public portal** (all URL guesses 404; orgId 58 route is a 302
  loop) → no financial disclosure of its own yet. `agencies` row should carry both the old
  directorate lineage and the new department (parent link), with the cabinet date.
- University block grant: **₹5,584 cr "assistance to universities"** in BE 2025-26 — verified
  verbatim in the PRS 2025-26 PDF (fetched).

**PM-USHA (ex-RUSA)** 🔎
- pmusha.education.gov.in is a JS-only SPA BUT hosts static fetchable docs under
  `/pm-usha/assets/docs/` — **PAB-3 minutes (meeting 19.11.2024) downloaded & extracted**
  (4.5 MB scan; OCR noisy but Bihar annexure read directly):
  - **MERU ₹100 cr each**: Lalit Narayan Mithila University (AISHE U-0068), Patna University (U-0074)
  - **GSU ₹20 cr each**: BN Mandal Univ Madhepura, Jai Prakash Vishwavidyalaya Chapra, Nalanda Open Univ
  - **GSC ₹5 cr each**: 15 Bihar colleges
  - **Total PAB-3 approvals for Bihar ≈ ₹335 cr.** Bihar onboarded late (with Kerala, Odisha).
- Scheme outlay ₹12,926.10 cr (2023-26) ⚠️ snippet-only (PIB 403). **Releases/expenditure for
  Bihar: not public** — approvals only. State-share + UC status = RTI. (Cross-check: CAG SFAR
  2023-24 flags the RUSA/PM-USHA capital head fully unspent in FY24 — §4.4 ✅.) Legacy portal
  **rusa.nic.in is now DNS-dead** (ENOTFOUND 2026-07-13); migrated content lives thinly on the
  pmusha SPA and BSHEC's own site.

**Bihar State Higher Education Council (BSHEC) — the PM-USHA state implementing unit** 🔎
- **https://bshec.bihar.gov.in/** (fetched) is the state channel for RUSA/PM-USHA money, yet
  publishes only the "BSHEC Rules 2020" PDF, an NEP-2020 deck, and a "State Workshop on PFMS"
  deck — **zero budget, accounts, fund-release, State Higher Education Plan (SHEP), or
  project-approval data**; no RTI/Section-4 page, no rupee figure anywhere. The body that
  actually receives PM-USHA funds discloses nothing → RTI.

**Bihar State University Service Commission (BSUSC)** 🔎
- **bsusc.bihar.gov.in** (fetched) — statutory recruiter of university/college teachers under
  the **BSUSC Act 2017**, office **inside the BSEB Academic Building, Budh Marg, Patna**.
  Recruitment notices/results only — **no budget, annual report, or accounts**. Recruitment
  volume drives the salary-grant line, but its own spend is undisclosed → RTI.

**Universities accountability** 🔎
- CAG performance & compliance audit (year ended 31.03.2022, **tabled 26.03.2025**) examined
  **11 state universities**: 2017-22 provision ₹22,576.33 cr, **~₹4,134 cr (18%) unutilised
  and surrendered**; ₹27.82 cr subsequent UGC grants foregone; ₹48.28 cr salary arrears paid
  without Pay Verification Cell checks; 57% teaching posts vacant. Via patnapress.com
  25.03.2025 (fetched) ⚠️. **Report number now confirmed as CAG Report No. 5 of 2024** and the
  "18% of 2017-22 provision unutilised" ratio independently corroborated (re-checked
  2026-07-13); the exact surrender figure differs by source (₹4,134.01 cr vs ₹4,134.21 cr) and
  neither is byte-verified — CAG's server refuses programmatic fetch (§9), so verify against the
  report PDF before loading.
- Test case Patna University (pup.ac.in, fetched): Budget page stops at **2019-20**; "Annual
  Reports" are examination reports only. **No Bihar *state* university found publishing audited
  accounts online** — incl. **Nalanda Open University** (state, NOU Act 1995), whose statute
  routes accounts to an AG-Bihar audit + official-Gazette publication only, nothing on a portal.
  ⚠️ Do not conflate with **Nalanda University**, Rajgir (central, MEA-funded) — the lone
  Bihar-located university that *does* publish Annual Accounts + Audit Reports (FY20-21/21-22/
  23-24) online (nalandauniv.edu.in).

**RTI candidates from this section:** BSEB accounts/budgets/audit-status/tender awards; new
Higher Education Dept budget + university-wise block-grant releases; PM-USHA Bihar state-share
releases + expenditure + UCs vs the ₹335 cr approvals; university audited accounts + AG
inspection reports.
### 8.4 SIRD Bihar / Panchayati Raj Dept / Rural Development Dept (investigated 2026-07-12)

**The SIRD question — answered** 🔎
- Bihar's SIRD (created by notification no. 7036 dated 15.09.2005, located at WALMI
  Phulwarisharif with the ATI) **was merged into BIPARD w.e.f. 01.04.2006** (Societies Act
  registration) — verified from the archived text of the old BIPARD site
  (bipard.bih.nic.in/Introduction.htm via Wayback 2017-04-03; live domain DNS-dead).
  Post-Jharkhand, the original ATI+SIRD at Ranchi went to Jharkhand.
- rgsa.gov.in's SIRD roster: 25 states listed, **no Bihar** (fetched HTML; Jharkhand also absent).
- **The de-facto RGSA training institution is the State Panchayat Resource Centre (SPRC), run
  by the Bihar Gram Swaraj Yojana Society (BGSYS)** under the Panchayati Raj Dept — Bihar PRD
  sanction letters route RGSA training funds to "राज्य पंचायत संसाधन केन्द्र (बिहार ग्राम स्वराज योजना
  सोसाईटी)" (e.g. ₹14.25 cr, letter 15788 of 14.12.2023; ₹3.40 cr training & capacity building,
  letter 12618 of 27.12.2024), and the CEC minutes budget "1 SPRC, 38 DPRCs, 295 BPRCs".
  BGSYS portal: bgsys.bihar.gov.in (originally the World-Bank-project SPV) — no accounts published.
  → `agencies`: BIPARD absorbs SIRD lineage; BGSYS/SPRC is a separate training agency row.

**Panchayati Raj Department portal** 🔎
- Live at state.bihar.gov.in/biharprd/ (orgId 33; TLS-chain broken + session-cookie dance —
  fetch via curl -k after `ULBHome.html?resetULB&orgId=33`).
- **Best below-release money trail found in the whole discovery**: the portal's **"Sanction
  and Allotment letter" table (rowId=3217) — 1,393 rows** of orders (letter no., date, Hindi
  subject incl. amounts, per-letter PDF). 34 RGSA letters 2021→2026 include: ₹12.17 cr training
  + infra (52(SWI) 15.03.2021); **₹14.60 cr elected-rep base training** (42(SWI) 25.01.2022);
  ₹33.96 L panchayat-sachiv training (7462, 02.08.2022); ₹89.42 L GPDP training (10690,
  08.11.2022); ₹25 cr central share (90(AA) 05.03.2024 & 09(SWI) 02.05.2025); ₹1.4767 cr state
  share (68(SWI) 15.12.2025); ₹16.67 cr centre+state (84(SWI) 10.03.2026); plus RGSA-funded
  Panchayat Sarkar Bhawan construction (₹49.40 cr 2022, ₹50.15 cr 2023) and technical-assistant
  honoraria from RGSA (₹16.58 cr, 2022). **Barrier:** the per-letter PDFs need the portal's
  JS/session (listing text with amounts is scrapeable).
- Also: 4 training-module PDFs (curriculum), links to BGSYS/e-Panchayat/eGramSwaraj, and —
  notably — **PFMS/CFMS fund-transfer records kept in a linked Google Drive folder**, not the portal.
- Negative: no consolidated training budget, no RGSA SAAP document, no training counts, no
  annual report on the portal.

**RGSA plan-level documents (MoPR)** 🔎
- **CEC minutes, 1st meeting for 2025-26 (07.04.2025)** — fetched & extracted from the MoPR
  s3waas CDN: Bihar submitted AAP of **₹209.72 cr** (CB&T for 382,296 participants); CEC
  **approved ₹180.17 cr**; Bihar "achieved 77.67% of CB&T target"; exposure visits halved.
  **Annexure-V full Bihar component budget**: CB&T ₹78.98 cr (GPDP/LSDG 98,474 @ ₹23.01 cr;
  specialized 128,525 @ ₹23.99 cr; other 155,297 @ ₹31.98 cr), other CB&T ₹19.24 cr,
  institutional infra ₹14.03 cr (1 SPRC, 14 DPRCs rented, 295 BPRCs), recurring ₹20.83 cr,
  computers ₹16.93 cr (171 units @ ₹78,000), IEC ₹3.48 cr, PMU ₹2.61 cr.
  URL: cdnbbsr.s3waas.gov.in/…/2025/04/202504281979062160.pdf
- rgsa.gov.in report pages + trainingonline.gov.in (TMP) dashboards are session/CSRF-gated
  against headless fetch (Bihar selectable; values JS-only). One MoPR June-2024 PDF is a
  scanned image needing OCR.

**Rural Development Department / JEEViKA** 🔎
- RDD portal live (orgId 32, same access pattern); links Bihar Social Audit Society
  (socialauditsociety.bihar.gov.in — MGNREGA remit) and JEEViKA at brlp.in (**403/dead**);
  working JEEViKA site is **brlps.in**. **Correction (verified 2026-07-13):** contrary to an
  earlier "no reports" read, **brlps.in/annualauditreports publishes a continuous run of Annual
  Reports FY 2005-06 → FY 2024-25** plus **World-Bank "BTDP" audit reports FY 2021-22 &
  FY 2022-23** — direct PDF downloads. Caveat: the audit reports cover only the WB-funded BTDP
  project (two FYs), **not** full-society statutory audited accounts, and the annual reports are
  narrative (no clean total-outlay / NRLM central-state-share line) → verify per figure.
- DDU-GKY: Bihar page on ddugky.gov.in ⚠️; state-wise fund-release datasets on data.gov.in
  (2017-18→2023-24) ⚠️ — no BRLPS-published Bihar expenditure.

**15th FC grants to Bihar PRIs** 🔎
- Master table fetched: MoPR "Updated 15th FC (2021-26) Allocation and release as on
  18.02.2025" — Bihar (₹ cr, alloc/released): 2020-21 5,018/5,018 · 2021-22 3,709/3,709 ·
  2022-23 3,842/3,842 · 2023-24 3,884/3,855.33 · **2024-25 4,114/1,942.17** · 2025-26 alloc
  4,012; cumulative **24,579 allocated / 18,366.50 released**.
  (Supersedes the Annual-Report-derived 2024-25 release figure in §7.3 — pin both, prefer the
  later-dated table.)
- eGramSwaraj analytical dashboard + AuditOnline citizen reports (GP audit reports) are
  JS/session-gated — whether Bihar GP audit reports are populated is **unresolved headlessly**.

**RTI candidates from this section:** actual expenditure vs RGSA sanctions (UCs, SNA
statements); BGSYS/SPRC audited accounts; per-programme training costs + participant lists by
tier; the formal designation order (BGSYS-SPRC vs BIPARD) + the 2005 SIRD notification;
Bihar's submitted SAAPs; DPRC/BPRC operational spend; 15th FC education-adjacent GP utilisation;
BRLPS full-society statutory audited accounts (beyond the BTDP-project audits) + verified FY
total outlay with NRLM central/state-share split; DDU-GKY Bihar expenditure.
### 8.5 e-Shikshakosh / VSK / DIKSHA / ICT & biometric attendance / GeM (investigated 2026-07-12)

**e-Shikshakosh** 🔎
- Live at https://eshikshakosh.bihar.gov.in/ (HTTP 200 via curl -k; **broken TLS chain** +
  Angular SPA — nothing server-rendered). Full school-education lifecycle system: selfie-based
  geo-fenced teacher attendance (salary-linked), student/teacher/school registries, MDM,
  inspections.
- **Builder: CSM Technologies (private vendor) — not NIC, not BELTRON** — per NeGD "India
  Stack State Directory" entry #283 (negd.gov.in/isl/Directory/statedata/283, fetched);
  owner = BEPC/Education Dept; stack Angular 13 + Laravel/Lumen + MySQL + KONG. CSM's own case
  study (csm.tech/casestudy/e-shikshakosh, fetched): **launched Feb 2022**, 70,000+ schools.
  Play Store (developer = BEPC): 1M+ installs.
- **Contract value: not published anywhere** (searched EN + HI). → RTI.
- District Cells RFP: **BEPC/D-Cell/2025-26/3472 dated 26.07.2025** (53-pp PDF downloaded) —
  manpower outsourcing for e-Shikshakosh cells in all 38 DEO offices, 3 zones, 12 months,
  EMD ₹5 L/zone; **no estimated value stated**; bids via eproc2.
- Statewide-mandatory app attendance from an ACS-level order dated 27.08.2025 ⚠️ (news only;
  order itself not online).

**Vidya Samiksha Kendra (VSK) Bihar** 🔎
- **Still under procurement; no award published.** Full RFP downloaded:
  **BEPC/VSK/2025-26/2424 dated 04.06.2025** (46 pp): NDEAR-compliant command centre, 4×3 video
  wall, 10 dashboards, cloud infra, 7 O&M staff; 4-month capex + 12-month opex (ext. to 3 yrs);
  QCBS 70:30; **no estimated value in the RFP** (₹15 cr turnover floor ⇒ modest size). Bids
  closed 26.06.2025; no financial-bid result on bepcssa.in as of 2026-07-12.
- Central context (ThePrint 20.05.2023, fetched): Bihar among 15 states given the NCERT starter
  pack; VSKs funded from Samagra Shiksha, typically **₹2–5 cr**. The Bihar-specific PAB-approved
  VSK line sits in the 2023-24→2025-26 PAB minutes (availability conflict — see §8.1).

**DIKSHA in Bihar** 🔎
- Bihar/SCERT deck to CIET-NCERT (46 pp, downloaded; internal dates Dec 2022–Jan 2023):
  2017-21 SCERT e-content group uploaded **7+ lakh e-contents** (QR-coded textbooks cl. 1-8);
  **83 CPD courses** on DIKSHA Bihar; NISHTHA-on-DIKSHA "4+ lakh certified"; ecosystem =
  e-Shikshan, UNNAYAN (5,646 secondary schools), DD Bihar slots, BEST app.
- **DIKSHA content spend: not online** (₹38.7 L approved FY22 per PAB — §8.1; actuals unknown). → RTI.
- **e-LOTS** (bepclots.bihar.gov.in): live but **TLS cert expired**; WordPress; joint
  **BEPC + UNICEF** collaboration (partly donor-funded, not purely procured).

**ICT@Schools history (pre-Samagra)** 🔎
- Primary doc recovered: **BSEIDC** (not BEPC) BOOT retender
  **BSEIDC/PI/05/2011(Retender)-514 dated 11.05.2012** (original BSEIDC/PI/05/2011-397 dated
  01.12.2011) — ICT in **1,000 schools**, 5-yr BOOT, zonal awards; 10 computers+server/school;
  **no values/vendors in the doc** (bseidc.in/ICT@Schools_retender.doc, fetched).
- Earlier models per the CIET deck: BEP model (234 cluster schools), BOOT model (141 centres,
  MoUs with 29 NGOs), e-Samarth (619 CAL centres; **BSEDC + IL&FS consortium**, 244 centres).
- **NIIT–BELTRON 2008**: turnkey computer education in 400 govt schools / 6 lakh students,
  3 years (NIIT press release 05.09.2008, fetched); **value undisclosed**.
- No Bihar CAG audit of ICT@Schools found (negative). Academic follow-up (⚠️): ~1,300 schools
  over a decade; labs largely dysfunctional.
- Current wave: BEPC RFP **BEPC/ICT/2024-25/4449 dated 26.11.2024** — ICT labs BOOT in
  **4,465 schools** (no value); Careers360 06.05.2026 (fetched): announced ICT labs in
  **5,907 schools for ₹377 cr** ("Digital Bihar, Smart Schools") — agency/vendor unnamed. ⚠️

**Biometric / facial recognition** 🔎
- FRS runs **inside e-Shikshakosh** on govt-supplied tablets; announced Nov 2024 by ACS
  S. Siddharth; rollout from Jan 2025 targeting 3+ crore students / ~75,000 schools (MDM &
  scholarship leakage control). Procurement: RFP e-Tender 53309 + **Corrigendum
  BEPC/BAS/2024-25/4842 dated 23.12.2024**. **Vendor + value not published.** Aggregators
  conflate ref "BEPC/SL/2024-25/963" between FRS and VSK — unresolved aggregator conflict.

**GeM / the RailTel proxy — key accountability find** 🔎
- GeM public bid search is session-bound/403 to fetchers — **award values not retrievable from
  GeM**. One indexed BEPC GeM ref: GEM/2024/B/5705286 ⚠️.
- **PSU stock-exchange disclosures are the usable public proxy for BEPC contract values**
  (RailTel is listed and must disclose):
  - **₹970.08 cr** LoA to RailTel, 25.09.2025 — turnkey Physics/Chem/Bio labs in govt
    secondary/senior-secondary schools under Samagra Shiksha 2025-26 (multiple outlets, fetched/⚠️ mix).
  - **₹713.52 cr across 5 contracts** (angelone.in 09.09.2025, fetched): smart classrooms middle
    ₹262.14 cr + secondary ₹257.50 cr; **ICT labs ₹44.21 cr**; TLM cl. I-V ₹89.91 cr; ISM labs ₹59.76 cr.
  - A further **₹396 cr** reported same-day as *distinct* (indiainfoline/indianmasterminds) —
    ⚠️ overlap with the ₹713.52 cr batch unresolved; pull RailTel's BSE/NSE filings before loading.
  - Cumulative RailTel-from-BEPC orders reported >₹7,140 cr ⚠️ (scanx.trade) — if真, RailTel is
    the dominant conduit for Bihar school-EdTech capital spend; nomination-vs-GeM route undisclosed.
  - Adjacent higher-ed: RailTel ₹574.8 cr from **BSEIDC** for college/university smart
    classrooms + ICT labs ⚠️.
- Primary documents saved by the research pass (in `/tmp/bihar-edtech/`): VSK_RFP_2424.pdf,
  district_cell_rfp.pdf, ict_retender.txt, ciet_bihar.pdf — copy into the repo before they're
  garbage-collected.

**RTI candidates from this section:** CSM Tech e-Shikshakosh contract (value/route/renewals);
D-Cell zone awards; VSK financial-bid outcome + PAB VSK line; FRS vendor+value+data-protection
terms; tablet procurement; ICT-lab BOOT awards (4,465-school RFP + ₹377 cr programme) and
whether RailTel's ₹44.21 cr is part; Block ICT Coordinator rates; complete RailTel–BEPC order
book with procurement route; BSEIDC 2011-12 zonal awards + NIIT-BELTRON 2008 value; e-LOTS
cost split with UNICEF; DIKSHA content spend actuals.
### 8.6 BSEFCL & BSCC / scholarship portals / DBT Bharat / PM POSHAN social audit (investigated 2026-07-12)

**BSEFCL (Bihar State Education Finance Corporation Limited)** 🔎
- Corporate identity: CIN **U74999BR2018SGC037649**, incorporated 27.03.2018, State Government
  Company, RoC-Patna, regd. office Secretariat Annexe, Patna. FY2024 revenue ₹10.26 cr /
  paid-up capital ₹9.5 cr per MCA-data aggregator (thecompanycheck.com, fetched 2026-07-12) —
  balance-sheet detail paywalled at MCA.
- Portal: https://www.bsefcl.bihar.gov.in (bare domain w/o `www` does not resolve) — a
  client-rendered SPA titled "Student Portal"; **no annual reports, accounts, statistics, or
  RTI section**; `site:` search indexes only the homepage. **A state company handling the BSCC
  loan book publishes zero financials → RTI.**
- The Finance-Dept banner target educationbihar.gov.in/StudentCreditCard.aspx is a **dead
  legacy site** (ECONNREFUSED; last updated ~Apr 2019 per snippets); current dept site is
  state.bihar.gov.in/educationbihar (TLS-chain-broken to automated fetchers).

**BSCC figures** 🔎
- **An official aggregate dashboard exists**: https://www.7nishchay-yuvaupmission.bihar.gov.in/dashboard
  with columns Applications Received at DRCC / Loan Sanctioned / Rejected / Under Process /
  Sanctioned Loan Amount (₹) / Loan Disbursed Applications / Disbursed Loan Amount (₹) — but
  values load client-side; static fetch shows "Please Wait…." (fetched 2×, 2026-07-12).
  **Data is online but needs a JS browser** — the best non-RTI route to BSCC aggregates.
- News-sourced figures (⚠️ `reported` provenance only, no GO/document cited):
  cumulative to ~May 2025 — ₹11,144 cr sanctioned to 3.73 lakh students, ₹7,129 cr disbursed to
  3.54 lakh (patnapress.com 19.05.2025, fetched); FY 2024-25 — ₹1,715.23 cr disbursed to 80,236
  students (94.35% of target); FY 2025-26 — ₹1,013.23 cr sanctioned for 1.27 lakh students
  (thedailyjagran.com 25.06.2025, fetched); ₹300 cr third instalment / ₹900 cr in-year to
  BSEFCL (drishtiias.com 07.08.2025, fetched); BSEFCL took over all new disbursements from
  banks w.e.f. 13.05.2025 (patnapress).
- ❌ Do NOT use: "₹4,417 cr sanctioned / ₹2,282 cr disbursed" — appeared only in a
  search-engine synthesis, no attributable page.
- Bihar Economic Survey 2024-25 PDF URL exists on the Finance site
  (`…/Economic%20Survey%20Final%2022.02.2025…pdf`) but was TLS-blocked; its BSCC content
  unconfirmed either way.

**Scholarship portals** 🔎
- **pmsonline.bihar.gov.in** (BC/EBC post-matric) and **scstpmsonline.bihar.gov.in** (SC/ST
  post-matric — "Chief Minister SC & ST Post-Matric Scholarship") — both live, fetched
  2026-07-12; application front-ends only; **no beneficiary counts or disbursement amounts**.
  Legacy pmsonline.bih.nic.in dead (ECONNREFUSED). Institution side: instpmsonline.bihar.gov.in ⚠️.
- Ownership ambiguity (flagged, not resolved): welfare departments (SC/ST, BC/EBC, Minority)
  own the schemes per secondary sources, while the fetched portals' footers attribute to
  Education Dept / Directorate of Secondary Education as operator. Minority post-matric goes
  via NSP (scholarships.gov.in), whose public dashboard is a JS shell.

**DBT portals** 🔎
- dbtbharat.gov.in Bihar dashboard (scode=MTA=): cumulative DBT **₹87,272.6 cr**, 183 schemes —
  **no scheme-wise or education split** (fetched 2026-07-12).
- **dbt.bihar.gov.in** (NIC): cumulative "₹135,206.00 Cr", 21 departments / 135 schemes;
  `DepartmentSchemeWiseReport.aspx` lists scheme **names + codes but no amounts** — Education
  (Cycle C4ALU, Balika Poshak CBW9L), SC&ST Welfare (Post-Matric ST E0WBO, Pre-Matric ST ETCZ9),
  BC/EBC (E8NJA, EVNFW), Minority (E2UWR, EFLHM). `Cumulative_Report.aspx` → HTTP 500.
  **The scheme codes are ready-made RTI reference identifiers.** Note the two portals' cumulative
  totals (₹87.3k cr vs ₹135.2k cr) disagree — different scopes; do not reconcile silently.
- edudbt.bih.nic.in referenced as Education-DBT status portal ⚠️ unverified.

**PM POSHAN accountability in Bihar** 🔎
- **No Bihar social-audit report found anywhere.** National repository
  pmposhan.education.gov.in/Social_Audit.html (indexed; TLS/500-blocked) holds other states'
  pilots only; Bihar's Social Audit Society site TLS-blocked (remit is MGNREGA);
  biharsocialaudit.com (civil society, fetched) is actively *demanding* social audits — corroborating absence.
- State MDM infrastructure dark: mdm.bihar.gov.in DNS-dead; mdmsbihar.org self-signed cert;
  dopahar.org HTTP 403. **No accessible state utilisation/coverage reporting.**
- PAB-PM POSHAN 2025-26 signal (careers360.com 13.06.2025, fetched): Bihar enrolment fell
  6.14 lakh and MDM coverage fell 4.91 lakh YoY; Bihar among 19 states told to investigate by
  30.06.2025.

**RTI candidates from this section:** BSEFCL audited accounts FY19→; BSCC FY-wise
sanction/disbursement series + repayment/NPA book; scheme-wise scholarship disbursement totals
per welfare department (cite DBT scheme codes); scheme-vs-portal ownership GOs; Bihar PM POSHAN
social-audit status; MDM UCs/QPRs/coverage MIS.

---

## 9. Cross-cutting access barriers (affects the ingestion pipeline)

| Barrier | Where | Consequence |
|---|---|---|
| Scanned/vector PDFs without text layer | PAB minutes (Bihar 2026-27), budget.bihar.gov.in-era DfG | manual/OCR extraction + human verification per figure |
| JS-only SPAs serving empty shells | PRABANDH, BIPARD, dsel-education.gov.in, eproc2 | fetch via API endpoints or browser automation; record endpoints |
| Login gates | PRABANDH modules, Medhasoft Official Reports, tracker.bepcssa.in | RTI targets |
| Anti-scraping / broken TLS | eproc2 (incomplete chain + HTTP 500 to scripts), budget.bihar.gov.in (expired cert) | curl -k / browser only; note in provenance |
| Whole site down | pmposhan.education.gov.in (HTTP 500 site-wide since ≤2026-07-10) | Wayback partial only; RTI/alternate |
| CAG server refuses programmatic fetch | cag.gov.in/uploads/download_audit_report/… (HTTP 522 / socket-hang-up to curl + fetchers) | download via browser; figures via CAG press briefs / news until the report PDF is byte-verified |
| Dead dedicated dept domains → master-portal shells | prd/rdd/sird/biharpanchayat.bihar.gov.in (NXDOMAIN); depts live only at state.bihar.gov.in/{slug}/ behind a mismatched-intermediate TLS chain + JSESSIONID dance | curl -k + session cookie; content is JS-injected (absent from served HTML) → often RTI |
| External file hosting | CAG "All Grants" via SharePoint; Economic Surveys via Google Drive | mirror-on-ingest; cite original |
| Off-budget flows | ₹24,305.18 cr GoI→agency direct (FY23), Finance Accounts Vol II App. VI (unaudited) | DfG-only view undercounts; model as separate funding_source |

## 10. Refuted / do-not-cite

- "budget.bihar.gov.in hosts detailed budget data" — **refuted 0-3**.
- "budget.bihar.gov.in archive proves no prior-year documents exist anywhere on the domain" — **refuted 0-3** (over-claim).
- Finance Dept homepage "directs users to budget.bihar.gov.in for detailed data" — **refuted 0-3**.
- (From prior project work, still in force:) coaching-site figures like "Education ₹60,204 cr
  attributed to PRS" are fabrications — never cite PRS figures not verbatim in a PRS PDF.
- Higher Education Dept "₹8,012 cr" 2026-27 allocation (aggregator academicjobs.com) —
  **unverified**; the same page repeats the ₹60,204 cr PRS fabrication above. Verify any
  HE-dept figure against the actual 2026-27 Demands-for-Grants PDF before loading.
