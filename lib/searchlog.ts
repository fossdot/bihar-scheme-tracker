import { query } from "./db";
import type { SchemeFilters } from "./types";

type LogArgs = {
  surface: "finder" | "guided" | "navbar";
  q?: string | null;
  filters?: Partial<SchemeFilters>;
  resultCount: number;
};

/**
 * Record one search, fire-and-forget. Never blocks the request and never throws — analytics
 * must not break search. No cookies / IP / identity are stored; only the anonymous query shape.
 * Rows with result_count = 0 reveal what people want that we don't have yet.
 */
export function logSearch({ surface, q, filters, resultCount }: LogArgs): void {
  if (!process.env.DATABASE_URL) return;
  const cleanQ = (q ?? "").trim() || null;
  // strip q out of the stored filters blob (it has its own column)
  const { q: _omit, ...facets } = (filters ?? {}) as Record<string, unknown>;
  try {
    void query(
      `insert into search_events (surface, q, filters, result_count) values ($1, $2, $3::jsonb, $4)`,
      [surface, cleanQ, JSON.stringify(facets), resultCount],
    ).catch(() => {
      /* table may not exist yet, or DB hiccup — analytics is best-effort */
    });
  } catch {
    /* getPool() can throw synchronously if misconfigured — ignore */
  }
}
