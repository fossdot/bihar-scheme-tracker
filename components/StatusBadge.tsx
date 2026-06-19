import type { Locale } from "@/lib/i18n";
import { STATUS_META } from "@/lib/status";
import type { SchemeStatus } from "@/lib/types";

/** Status as a quiet dot + text label (label carries the meaning, so it survives
 *  greyscale / colour-blindness). Brand = active, amber = possibly active, grey = inactive. */
export function StatusBadge({
  status,
  locale,
  size = "md",
}: {
  status: SchemeStatus;
  locale: Locale;
  size?: "sm" | "md";
}) {
  const meta = STATUS_META[status] ?? STATUS_META.unknown;
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
