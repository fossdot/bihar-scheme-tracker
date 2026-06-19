// Relative-date language (endoflife.date-style) — bilingual, deterministic (caller passes
// `today` as 'YYYY-MM-DD'). Compact units: "8 mo ago", "in 11 days", "valid 3 yr 6 mo more".

import type { Locale } from "./i18n";

const U = {
  yr: { en: "yr", hi: "वर्ष" },
  mo: { en: "mo", hi: "माह" },
  day: { en: "day", hi: "दिन" },
  days: { en: "days", hi: "दिन" },
};

function toDate(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  return m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])) : null;
}

/** Display an ISO date ('YYYY-MM-DD') as DD-MM-YYYY (Indian convention). Non-dates pass
 *  through unchanged; null/empty → null so callers can render an em dash. */
export function fmtDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : iso;
}

/** Calendar diff from→to (assumes from ≤ to). */
function diff(from: Date, to: Date) {
  let y = to.getUTCFullYear() - from.getUTCFullYear();
  let mo = to.getUTCMonth() - from.getUTCMonth();
  let d = to.getUTCDate() - from.getUTCDate();
  if (d < 0) {
    const prevMonthDays = new Date(
      Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), 0)
    ).getUTCDate();
    d += prevMonthDays;
    mo -= 1;
  }
  if (mo < 0) {
    mo += 12;
    y -= 1;
  }
  const totalDays = Math.round((to.getTime() - from.getTime()) / 86_400_000);
  return { y, mo, d, totalDays };
}

function phrase(y: number, mo: number, d: number, locale: Locale): string {
  const w = (k: keyof typeof U, n: number) => `${n} ${U[k][locale]}`;
  if (y > 0) return mo > 0 ? `${w("yr", y)} ${w("mo", mo)}` : w("yr", y);
  if (mo > 0) return w("mo", mo);
  return `${Math.max(d, 0)} ${d === 1 ? U.day[locale] : U.days[locale]}`;
}

/** "8 mo ago" / "in 11 days" (and the Hindi equivalents). Null for a bad/empty date. */
export function ago(
  iso: string | null | undefined,
  today: string,
  locale: Locale
): string | null {
  const a = toDate(iso);
  const b = toDate(today);
  if (!a || !b) return null;
  if (a.getTime() === b.getTime())
    return locale === "hi" ? "आज" : "today";
  const past = a < b;
  const p = past ? phrase2(a, b, locale) : phrase2(b, a, locale);
  if (locale === "hi") return past ? `${p} पहले` : `${p} में`;
  return past ? `${p} ago` : `in ${p}`;
}

function phrase2(from: Date, to: Date, locale: Locale): string {
  const { y, mo, d } = diff(from, to);
  return phrase(y, mo, d, locale);
}

/** Days between today and iso (negative = past). Null for bad dates. */
export function daysUntil(iso: string | null | undefined, today: string): number | null {
  const a = toDate(iso);
  const b = toDate(today);
  if (!a || !b) return null;
  return Math.round((a.getTime() - b.getTime()) / 86_400_000);
}

/** `last_verified` is considered stale after ~1 year — prompts re-verification. */
export function isStale(iso: string | null | undefined, today: string): boolean {
  const n = daysUntil(iso, today);
  return n != null && n < -365;
}

/** Validity phrase for a policy's period_end. */
export function validityLabel(
  end: string | null | undefined,
  today: string,
  locale: Locale
): { text: string; past: boolean } | null {
  if (!end) return null;
  const n = daysUntil(end, today);
  if (n == null) return null;
  const a = toDate(today)!;
  const b = toDate(end)!;
  const bare = n >= 0 ? phrase2(a, b, locale) : phrase2(b, a, locale);
  if (n >= 0) {
    return {
      past: false,
      text: locale === "hi" ? `${bare} और वैध` : `valid ${bare} more`,
    };
  }
  return {
    past: true,
    text: locale === "hi" ? `${bare} पहले समाप्त` : `lapsed ${bare} ago`,
  };
}

/** Consultation-deadline phrase for a draft policy. */
export function deadlineLabel(
  end: string | null | undefined,
  today: string,
  locale: Locale
): { text: string; open: boolean } | null {
  if (!end) return null;
  const n = daysUntil(end, today);
  if (n == null) return null;
  const a = toDate(today)!;
  const b = toDate(end)!;
  if (n >= 0) {
    const bare = phrase2(a, b, locale);
    return {
      open: true,
      text: locale === "hi" ? `${bare} में बंद` : `closes in ${bare}`,
    };
  }
  const bare = phrase2(b, a, locale);
  return {
    open: false,
    text: locale === "hi" ? `${bare} पहले बंद` : `closed ${bare} ago`,
  };
}
