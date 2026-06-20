<!-- Thanks for contributing! Editing scheme/policy data? Run `npm run data:validate` locally first. -->

## What does this PR change?

<!-- e.g. "Corrects the Mahila Rojgar benefit amount" or "Adds Mukhyamantri Gramin Setu Yojana" -->

## Sources

<!-- Link the official source(s) for every fact you changed/added. Government portal, notification,
     PIB release, or myScheme — not a blog if avoidable. This is required. -->

-

## Checklist

- [ ] Every fact I changed/added has an **official `source_url`**, and I updated **`last_verified`** to today.
- [ ] If I set a **`status`**, the **`status_evidence`** explains why (what was checked, with a date + source) — I did **not** just assert it.
- [ ] I did **not** invent any figure. Where a number is only *reported* (not officially confirmed), I said so in the text ("reported … — verify at portal").
- [ ] Bilingual fields (`_en` / `_hi`) are filled where I could; dates are `YYYY-MM-DD`.
- [ ] I ran `npm run data:validate` and it passes.
