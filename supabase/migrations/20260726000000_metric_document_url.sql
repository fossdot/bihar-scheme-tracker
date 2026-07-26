-- Evidence documents for metrics: a downloadable copy of the document backing the figure —
-- e.g. a redacted RTI reply PDF committed under public/rti-docs/ (site-relative path) or an
-- absolute URL. The tracker and scheme provenance panels render it as a "Reply PDF" link, so
-- citizens can read the primary document, not just our extraction of it.
-- Privacy rule (repo is public): documents are published ONLY after redacting all personal data.
alter table scheme_metrics add column if not exists document_url text;
