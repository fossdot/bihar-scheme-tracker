---
description: Ingest an RTI reply/transfer/ack into the matching scheme_metrics row — extract → structure → translate → advance provenance. Never fabricates figures; never publishes personal data.
argument-hint: <path to the reply PDF/image, or paste the details>
---

You are folding an RTI response back into this repo's data. The document (reply, transfer notice, or
acknowledgement) is: **$ARGUMENTS**

Read `CLAUDE.md` and `docs/rti/README.md` first (the RTI lifecycle). Then:

## 1. Read & identify
- Read the document (image/PDF/text the maintainer provides). Translate the Hindi.
- Find the matching scheme in `data/schemes/*.yaml` and the specific `metrics[]` row it concerns
  (by `dimension`: usually `district`, `demographics`, or `outcomes`). If no matching metric row
  exists yet, add one.

## 2. Advance the provenance lifecycle honestly
- **Transfer / acknowledgement only (no data):** keep `provenance: rti_filed`. Update the `note`/`note_hi`
  with the real facts (filing date, department, any §6(3) transfer + the office it went to) and bump
  `as_of_date`. Do **not** set a `value`.
- **Actual figures received:** set `provenance: rti_received`, fill `value`, `unit`, `fiscal_year`,
  `as_of_date`, and record the reply date in `note`/`note_hi`. Enter **only** figures literally present
  in the reply.
- **Nil / partial / "does not hold" reply:** reflect that honestly in the note; leave `value: null`.
  Never fill a number the reply didn't give.

## 3. Privacy — do NOT publish personal data
This repo is **public**. Never write the maintainer's personal data into it — no home address, phone,
personal email, or RTI-portal account/reference IDs. Record only the **request's evidence trail**:
department/office, filing & transfer dates, and the lifecycle state. (An RTI reference number is
treated as private unless the maintainer explicitly says to include it.)

## 4. Validate, then hand back
- Keep both `note` and `note_hi` filled (bilingual).
- Run `npm run data:validate` (a `value` requires a `source_url`; `rti_filed`/`rti_needed` must have
  `value: null`). Fix any error.
- Present the change for review. Do **not** run `data:load` and do **not** commit unless asked.
