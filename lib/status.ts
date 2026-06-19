import type { SchemeStatus, StatusBucket } from "./types";

// ── Internal status → citizen-facing bucket (CLAUDE.md). "Possibly active" surfaces
//    by default so incomplete data never denies someone live help. ──
export const STATUS_BUCKET: Record<SchemeStatus, StatusBucket> = {
  active: "active",
  likely_active: "active",
  dormant: "possibly_active",
  unknown: "possibly_active",
  subsumed: "inactive",
  superseded: "inactive",
  lapsed: "inactive",
};

/** Which internal statuses belong to the given buckets. */
export function statusesForBuckets(buckets: StatusBucket[]): SchemeStatus[] {
  return (Object.keys(STATUS_BUCKET) as SchemeStatus[]).filter((s) =>
    buckets.includes(STATUS_BUCKET[s])
  );
}

export const BUCKET_META: Record<StatusBucket, { en: string; hi: string }> = {
  active: { en: "Active", hi: "सक्रिय" },
  possibly_active: { en: "Possibly active", hi: "संभवतः सक्रिय" },
  inactive: { en: "Inactive", hi: "निष्क्रिय" },
};

export const DEFAULT_BUCKETS: StatusBucket[] = ["active", "possibly_active"];

// Bilingual label + a small status DOT colour per status. Flat, low-chrome: the colour
// is a quiet cue on a small dot, and the text label always carries the meaning (so it
// survives greyscale / colour-blindness). No filled badges.
// NOTE: `dot` must be a complete literal class so Tailwind's content scanner sees it —
// this file is in the content globs for that reason.
export const STATUS_META: Record<
  SchemeStatus,
  { en: string; hi: string; dot: string }
> = {
  active: { en: "Active", hi: "सक्रिय", dot: "bg-brand" },
  likely_active: { en: "Likely active", hi: "संभवतः सक्रिय", dot: "bg-brand" },
  dormant: { en: "Dormant", hi: "निष्क्रिय", dot: "bg-warn" },
  unknown: { en: "Unknown", hi: "अज्ञात", dot: "bg-warn" },
  subsumed: { en: "Subsumed", hi: "समाहित", dot: "bg-muted" },
  superseded: { en: "Superseded", hi: "अधिक्रमित", dot: "bg-muted" },
  lapsed: { en: "Lapsed", hi: "समाप्त", dot: "bg-muted" },
};

/** Seeded placeholders are stored as "TODO — …: <source url>". Detect them so the
 *  UI can flag "not yet verified" instead of rendering the raw placeholder text. */
export function isUnverified(value: string | null | undefined): boolean {
  return typeof value === "string" && value.trimStart().startsWith("TODO");
}

/** Pull the source URL out of a TODO placeholder so it can be linked. */
export function extractUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  const m = value.match(/https?:\/\/\S+/);
  return m ? m[0] : null;
}

/** Split a status_evidence string into readable prose + its cited source URLs, so the UI
 *  can show clean prose and render the sources as proper links instead of a raw URL dump. */
export function splitEvidence(text: string | null | undefined): {
  prose: string;
  sources: string[];
} {
  if (!text) return { prose: "", sources: [] };
  const urls = Array.from(text.matchAll(/https?:\/\/[^\s);,]+/g)).map((m) =>
    m[0].replace(/[.,;]+$/, "")
  );
  // Drop a trailing "Sources: …" segment, then strip any stray inline URLs from the prose.
  let prose = text.replace(/\bSources?:\s*[\s\S]*$/i, "").trim();
  prose = prose
    .replace(/https?:\/\/[^\s);,]+/g, "")
    .replace(/\s+([.;,])/g, "$1")
    .replace(/\s{2,}/g, " ")
    .trim();
  return { prose, sources: Array.from(new Set(urls)) };
}

/** Short, human label for a source link — the hostname without "www.". */
export function hostLabel(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
