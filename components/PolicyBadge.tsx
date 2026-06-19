import type { Locale } from "@/lib/i18n";
import { POLICY_STATUS, policyStatusKey } from "@/lib/policy";

type Fields = {
  is_draft: boolean;
  superseded_by: string | null;
  period_end: string | null;
  consultation_end: string | null;
};

/** Derived policy status as a quiet dot + label (consistent with scheme StatusBadge). */
export function PolicyBadge({
  policy,
  today,
  locale,
  size = "md",
}: {
  policy: Fields;
  today: string;
  locale: Locale;
  size?: "sm" | "md";
}) {
  const meta = POLICY_STATUS[policyStatusKey(policy, today)];
  const text = size === "sm" ? "text-xs" : "text-sm";
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 font-medium text-ink ${text}`}
    >
      <span className={`h-2 w-2 shrink-0 rounded-full ${meta.dot}`} aria-hidden="true" />
      <span>{locale === "hi" ? meta.hi : meta.en}</span>
    </span>
  );
}
