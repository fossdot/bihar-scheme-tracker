-- Bilingual scheme_metrics: the registry is bilingual-first (CLAUDE.md), but scheme_metrics
-- carried single-language label/note, so the Hindi UI ( /hi ) rendered metric labels and notes
-- in English. Add _hi companions; null falls back to the English value at render time.
alter table scheme_metrics add column if not exists label_hi text;
alter table scheme_metrics add column if not exists note_hi  text;
