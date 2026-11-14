-- The LLM extracts each version of MVP.md once; `extracted` caches that result so reloads and
-- comparisons of the same version always use the same deliverables and criterion keys.
-- Holds the validated extraction, or the problems it found; null until extraction succeeds.
alter table mvp add column extracted jsonb;
