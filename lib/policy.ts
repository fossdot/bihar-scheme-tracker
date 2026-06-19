// Policy display status is DERIVED (never asserted) from the draft flag, consultation
// window, validity period and successor link — mirroring how scheme status comes from evidence.

export type PolicyStatusKey =
  | "open" // draft, consultation window open (or window unstated → verify)
  | "draft_closed" // draft, consultation window has passed
  | "in_force"
  | "lapsed"
  | "superseded";

export function policyStatusKey(
  p: {
    is_draft: boolean;
    superseded_by: string | null;
    period_end: string | null;
    consultation_end: string | null;
  },
  today: string
): PolicyStatusKey {
  if (p.superseded_by) return "superseded";
  if (p.is_draft) {
    if (p.consultation_end && p.consultation_end < today) return "draft_closed";
    return "open"; // within window, or window not stated (shown as "verify the deadline")
  }
  if (p.period_end && p.period_end < today) return "lapsed";
  return "in_force";
}

// Coarse buckets for the catalogue filter.
export type PolicyBucket = "open" | "in_force" | "past";
export function policyBucket(key: PolicyStatusKey): PolicyBucket {
  if (key === "open") return "open";
  if (key === "in_force") return "in_force";
  return "past"; // draft_closed, lapsed, superseded
}

export const POLICY_STATUS: Record<
  PolicyStatusKey,
  { en: string; hi: string; dot: string }
> = {
  open: { en: "Open for comments", hi: "टिप्पणी हेतु खुला", dot: "bg-brand" },
  draft_closed: {
    en: "Draft · consultation closed",
    hi: "प्रारूप · परामर्श समाप्त",
    dot: "bg-muted",
  },
  in_force: { en: "In force", hi: "लागू", dot: "bg-brand" },
  lapsed: { en: "Lapsed", hi: "समाप्त", dot: "bg-muted" },
  superseded: { en: "Superseded", hi: "अधिक्रमित", dot: "bg-muted" },
};

/** Today's date as 'YYYY-MM-DD' for status derivation (server-side). */
export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}
