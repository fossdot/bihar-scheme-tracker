# RTI track — sourcing the data the government doesn't publish

Much of the granular data this catalogue wants — district-wise distribution, demographic
(gender / social category) splits, year-wise disbursement, completion/outcome rates — is **not
published** anywhere. Where it isn't public, the honest answer is *"RTI needed"*, and the data
request itself becomes the evidence trail.

**Division of labour** (per `CLAUDE.md`):
- The **maintainer files** the RTI applications (and pays the ₹10 fee / claims BPL exemption).
- The **assistant drafts** the applications, **mines public sources first** (so we never file an
  RTI for something already published), and **ingests replies** (extract → structure → translate
  → load, citing the RTI reference number).

> **Mine before you file.** For marquee/central schemes, headline beneficiary + budget figures are
> often already public (finance-ministry reports, PIB releases, `budget.bihar.gov.in`, PRS). File
> an RTI only for what genuinely isn't published — usually the *district* and *demographic* splits.

## How a reply flows back into the catalogue

A `scheme_metrics` row carries a `provenance`; the RTI lifecycle moves it along:

1. **`rti_needed`** — value `NULL`; we know we lack it. (UI shows "RTI needed".)
2. **`rti_filed`** — application submitted; value still `NULL`, `note` records the filing date +
   department. (UI shows "RTI filed · awaiting".)
3. **`rti_received`** — reply in hand; set the real `value`, `unit`, `as_of_date`, and put the
   **RTI reference number + reply date** in `source_url`/`note`. (UI shows "RTI received".)

Edit the scheme's YAML in `data/schemes/`, run `npm run data:validate`, then `data:load`.

## Standard application format (RTI Act, 2005)

```
To,
The Public Information Officer (PIO),
<Department / Office>,
Government of Bihar  [or Government of India]

Subject: Request for information under Section 6 of the Right to Information Act, 2005.

Respected Sir/Madam,

I, a citizen of India, request the following information regarding the scheme(s)
named below. Please provide the information in electronic form (by email/CD) where possible.

[ Numbered, specific questions — see each application below. ]

Period of information: Financial Years <FY1> to <FY2> (latest available).

I am enclosing the application fee of ₹10 [ or: I belong to a BPL household; proof
enclosed; fee exempt under Section 7(5) ]. If the information is held by another public
authority, kindly transfer this application under Section 6(3) and inform me.

Name:            __________________________
Full address:    __________________________
Email / phone:   __________________________
Date:            __________________________
Signature:       __________________________
```

Drafted, ready-to-file applications (department-grouped) live alongside this file:
- **`bihar-state-departments.md`** — Bihar state department PIOs.
- Central schemes (PMJJBY, PMSBY, PMKVY, Sukanya Samriddhi, Stand-Up India) are **published-data
  first** — mine the finance-ministry / MSDE / PIB sources before any RTI; notes in that file.
